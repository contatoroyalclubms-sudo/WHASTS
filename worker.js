import { Router } from 'itty-router';

const router = Router();

class WhatsAppBusinessWorker {
    constructor(env) {
        this.env = env;
        this.kv = env.WHATSAPP_KV; // KV namespace
        this.db = env.WHATSAPP_DB; // D1 database
    }

    async handleRequest(request) {
        const url = new URL(request.url);
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: corsHeaders });
        }

        try {
            const response = await router.handle(request, this.env);
            
            Object.keys(corsHeaders).forEach(key => {
                response.headers.set(key, corsHeaders[key]);
            });
            
            return response;
        } catch (error) {
            return new Response(JSON.stringify({ 
                error: error.message,
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders 
                }
            });
        }
    }

    async processWhatsAppMessage(messageData) {
        const { from, body, messageId } = messageData;
        
        await this.saveMessage({
            message_id: messageId,
            from_phone: from,
            content: body,
            direction: 'incoming',
            timestamp: new Date().toISOString()
        });

        const response = await this.generateAutoResponse(from, body);
        
        if (response) {
            await this.sendWhatsAppMessage(from, response);
            
            await this.saveMessage({
                message_id: `bot_${Date.now()}`,
                from_phone: 'bot',
                to_phone: from,
                content: response,
                direction: 'outgoing',
                timestamp: new Date().toISOString()
            });
        }

        return { success: true, response };
    }

    async generateAutoResponse(phone, message) {
        const messageText = message.toLowerCase().trim();
        
        const customer = await this.getCustomer(phone);
        
        if (['oi', 'olá', 'menu', 'inicio'].includes(messageText)) {
            return this.getMainMenu();
        }
        
        if (messageText === '1' || messageText.includes('produto')) {
            const products = await this.getProducts();
            return this.formatProductsMenu(products);
        }
        
        if (messageText === '2' || messageText.includes('atendimento')) {
            await this.notifyHumanAgent(phone, message);
            return `👤 *Atendimento Humano*\n\nVocê foi direcionado para nossa equipe.\nUm atendente entrará em contato em breve.\n\n⏰ Horário: Segunda a Sexta, 8h às 18h`;
        }
        
        if (messageText === '3' || messageText.includes('empresa')) {
            return await this.getCompanyInfo();
        }
        
        if (messageText === '4' || messageText.includes('pedido')) {
            return `📋 *Consultar Pedido*\n\nPara consultar seu pedido, digite:\n*PEDIDO [número]*\n\nEx: PEDIDO 12345`;
        }
        
        if (messageText.startsWith('comprar ')) {
            const productId = messageText.replace('comprar ', '').trim();
            return await this.processProductPurchase(phone, productId);
        }
        
        if (messageText.startsWith('pedido ')) {
            const orderNumber = messageText.replace('pedido ', '').trim();
            return await this.getOrderStatus(phone, orderNumber);
        }
        
        return `❓ *Não entendi sua mensagem*\n\nDigite *MENU* para ver as opções disponíveis ou *2* para falar com um atendente.`;
    }

    getMainMenu() {
        return `🎭 *Bem-vindo ao Royal Club!*

Escolha uma opção:

*1* 🛍️ Ver Produtos/Serviços
*2* 👤 Falar com Atendente  
*3* ℹ️ Sobre a Empresa
*4* 📋 Status do Pedido

Digite o número da opção desejada.

_Powered by Cloudflare Workers_ ⚡`;
    }

    async formatProductsMenu(products) {
        let menu = `🛍️ *Nossos Produtos/Serviços:*\n\n`;
        
        products.forEach((product, index) => {
            menu += `*${product.id}.* ${product.name}\n`;
            menu += `💰 R$ ${parseFloat(product.price).toFixed(2)}\n`;
            menu += `📝 ${product.description}\n\n`;
        });
        
        menu += `💡 Para comprar, digite:\n*COMPRAR [número do produto]*\n\nEx: *COMPRAR 1*`;
        
        return menu;
    }

    async processProductPurchase(phone, productId) {
        try {
            const product = await this.getProductById(productId);
            if (!product) {
                return `❌ Produto não encontrado. Digite *1* para ver produtos disponíveis.`;
            }

            const orderNumber = await this.createOrder(phone, product);
            
            return `✅ *Pedido Criado!*

📦 *Produto:* ${product.name}
💰 *Valor:* R$ ${parseFloat(product.price).toFixed(2)}
🔢 *Pedido:* ${orderNumber}

Para finalizar, escolha o pagamento:
*PIX* - Pagamento instantâneo
*CARTAO* - Cartão de crédito

Digite sua opção.`;

        } catch (error) {
            console.error('Erro ao processar compra:', error);
            return `❌ Erro ao processar pedido. Tente novamente ou fale com nosso atendimento digitando *2*.`;
        }
    }

    async saveMessage(messageData) {
        const query = `
            INSERT INTO messages (message_id, from_phone, to_phone, content, direction, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await this.db.prepare(query).bind(
            messageData.message_id,
            messageData.from_phone,
            messageData.to_phone || null,
            messageData.content,
            messageData.direction,
            messageData.timestamp
        ).run();
    }

    async getCustomer(phone) {
        const query = `SELECT * FROM customers WHERE phone = ?`;
        const result = await this.db.prepare(query).bind(phone).first();
        
        if (!result) {
            await this.createCustomer(phone);
            return { phone, name: null, status: 'new' };
        }
        
        return result;
    }

    async createCustomer(phone) {
        const query = `
            INSERT INTO customers (phone, status, last_seen, created_at)
            VALUES (?, 'active', ?, ?)
        `;
        
        const now = new Date().toISOString();
        await this.db.prepare(query).bind(phone, now, now).run();
    }

    async getProducts() {
        const query = `SELECT * FROM products WHERE active = 1 ORDER BY id`;
        const { results } = await this.db.prepare(query).all();
        return results || [];
    }

    async getProductById(id) {
        const query = `SELECT * FROM products WHERE id = ? AND active = 1`;
        return await this.db.prepare(query).bind(id).first();
    }

    async createOrder(phone, product) {
        const orderNumber = `RC${Date.now()}`;
        const query = `
            INSERT INTO orders (order_number, customer_phone, total_amount, status, created_at)
            VALUES (?, ?, ?, 'pending', ?)
        `;
        
        await this.db.prepare(query).bind(
            orderNumber,
            phone,
            product.price,
            new Date().toISOString()
        ).run();
        
        return orderNumber;
    }

    async getOrderStatus(phone, orderNumber) {
        const query = `
            SELECT o.*, p.name as product_name 
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.order_number = ? AND o.customer_phone = ?
        `;
        
        const order = await this.db.prepare(query).bind(orderNumber, phone).first();
        
        if (!order) {
            return `❌ Pedido ${orderNumber} não encontrado para este número.`;
        }

        const statusMap = {
            'pending': '⏳ Pendente',
            'confirmed': '✅ Confirmado',
            'processing': '🔄 Processando',
            'shipped': '🚚 Enviado',
            'delivered': '📦 Entregue',
            'cancelled': '❌ Cancelado'
        };

        return `📋 *Status do Pedido ${orderNumber}*

📦 *Produto:* ${order.product_name || 'N/A'}
💰 *Valor:* R$ ${parseFloat(order.total_amount).toFixed(2)}
📊 *Status:* ${statusMap[order.status] || order.status}
📅 *Data:* ${new Date(order.created_at).toLocaleDateString('pt-BR')}

Para mais informações, fale com nosso atendimento digitando *2*.`;
    }

    async getCompanyInfo() {
        const info = await this.kv.get('company_info');
        
        if (info) {
            return JSON.parse(info).message;
        }
        
        return `🏢 *Royal Club*

🌟 *Sobre nós:*
Empresa especializada em eventos e entretenimento de qualidade.

📍 *Endereço:* Campo Grande - MS
📞 *Telefone:* (67) 99999-9999
🌐 *Site:* royalclub.com.br
📧 *Email:* contato@royalclub.com.br

⏰ *Horário de atendimento:*
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h
Domingo: Fechado

_Powered by Cloudflare Workers_ ⚡`;
    }

    async notifyHumanAgent(phone, message) {
        const notification = {
            phone,
            message,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        await this.kv.put(`agent_notification_${phone}_${Date.now()}`, JSON.stringify(notification));
    }

    async sendWhatsAppMessage(to, message) {
        console.log(`Enviando para ${to}: ${message}`);
        return true;
    }
}

router.get('/', async () => {
    return new Response(JSON.stringify({
        service: 'WhatsApp Business Automation',
        status: 'online',
        version: '2.0.0',
        powered_by: 'Cloudflare Workers',
        timestamp: new Date().toISOString()
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
});

router.get('/health', async () => {
    return new Response(JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'WhatsApp Bot',
        region: 'Global'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
});

router.post('/webhook/whatsapp', async (request, env) => {
    try {
        const bot = new WhatsAppBusinessWorker(env);
        const messageData = await request.json();
        
        const result = await bot.processWhatsAppMessage(messageData);
        
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

router.post('/api/send', async (request, env) => {
    try {
        const { to, message } = await request.json();
        const bot = new WhatsAppBusinessWorker(env);
        
        await bot.sendWhatsAppMessage(to, message);
        
        return new Response(JSON.stringify({
            success: true,
            message: 'Mensagem enviada'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

router.get('/api/products', async (request, env) => {
    try {
        const bot = new WhatsAppBusinessWorker(env);
        const products = await bot.getProducts();
        
        return new Response(JSON.stringify({
            success: true,
            data: products
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

router.get('/api/stats', async (request, env) => {
    try {
        const bot = new WhatsAppBusinessWorker(env);
        
        const totalCustomers = await bot.db.prepare('SELECT COUNT(*) as count FROM customers').first();
        const totalOrders = await bot.db.prepare('SELECT COUNT(*) as count FROM orders').first();
        const totalMessages = await bot.db.prepare('SELECT COUNT(*) as count FROM messages').first();
        
        return new Response(JSON.stringify({
            success: true,
            data: {
                customers: totalCustomers.count,
                orders: totalOrders.count,
                messages: totalMessages.count,
                uptime: '24/7',
                region: 'Global'
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

export default {
    async fetch(request, env, ctx) {
        const bot = new WhatsAppBusinessWorker(env);
        return await bot.handleRequest(request);
    }
};
