# 🎭 Royal Club - WhatsApp Business Automation

Sistema completo de automação WhatsApp Business usando Cloudflare Workers para máxima performance e escalabilidade global.

## 🚀 Características Principais

- **⚡ Performance Global**: Cloudflare Workers com latência <50ms mundial
- **🤖 Bot Inteligente**: Respostas automáticas com menu interativo
- **📊 Dashboard em Tempo Real**: Interface moderna com Alpine.js
- **🗄️ Banco D1**: SQLite distribuído globalmente
- **🔄 Escalabilidade Infinita**: Suporta milhões de mensagens
- **💰 Gestão de Produtos**: Catálogo com preços em Real (R$)
- **📋 Processamento de Pedidos**: Sistema completo de vendas
- **👥 Gestão de Clientes**: CRM integrado

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp API  │────│ Cloudflare Worker │────│   Dashboard     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌──────▼──────┐   ┌──────▼──────┐
                │ D1 Database │   │ KV Storage  │
                └─────────────┘   └─────────────┘
```

## 📦 Instalação Rápida

### 1. Clone o Repositório
```bash
git clone https://github.com/contatoroyalclubms-sudo/WHASTS.git
cd WHASTS
```

### 2. Deploy Automático
```bash
chmod +x deploy.sh
./deploy.sh
```

O script irá:
- ✅ Instalar Wrangler CLI
- ✅ Criar KV Namespace
- ✅ Criar banco D1
- ✅ Executar schema SQL
- ✅ Configurar secrets das APIs (OpenAI e Meta)
- ✅ Fazer deploy do Worker
- ✅ Configurar domínio (opcional)

**Importante**: Durante o deploy, você será solicitado a inserir as credenciais das APIs:
- OpenAI API Key
- Meta App ID, Secret e Access Tokens

### 3. Configurar WhatsApp
Configure seu webhook do WhatsApp para:
```
https://whatsapp-business-bot.SEU-SUBDOMINIO.workers.dev/webhook/whatsapp
```

## 🎯 Menu do Bot

O bot responde automaticamente com as seguintes opções:

```
🎭 Bem-vindo ao Royal Club!

Escolha uma opção:

1 🛍️ Ver Produtos/Serviços
2 👤 Falar com Atendente  
3 ℹ️ Sobre a Empresa
4 📋 Status do Pedido

Digite o número da opção desejada.
```

### Comandos Especiais
- `COMPRAR [número]` - Processar compra
- `PEDIDO [número]` - Consultar status
- `MENU` - Voltar ao menu principal

## 🛍️ Produtos Padrão

| ID | Produto | Preço | Descrição |
|----|---------|-------|-----------|
| 1 | Ingresso VIP | R$ 60,00 | Acesso completo com área VIP |
| 2 | Ingresso Standard | R$ 30,00 | Acesso básico ao evento |
| 3 | Combo Família | R$ 100,00 | 4 ingressos + 2 bebidas |

## 🔗 API Endpoints

### GET `/`
Status do serviço
```json
{
  "service": "WhatsApp Business Automation",
  "status": "online",
  "version": "2.0.0",
  "powered_by": "Cloudflare Workers"
}
```

### GET `/health`
Health check do sistema
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "WhatsApp Bot",
  "region": "Global"
}
```

### POST `/webhook/whatsapp`
Webhook para receber mensagens do WhatsApp
```json
{
  "from": "+5567999999999",
  "body": "Olá",
  "messageId": "msg_123"
}
```

### POST `/api/send`
Enviar mensagem via API
```json
{
  "to": "+5567999999999",
  "message": "Sua mensagem aqui"
}
```

### GET `/api/products`
Listar produtos disponíveis
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ingresso VIP",
      "price": 60.00,
      "description": "Acesso completo ao evento"
    }
  ]
}
```

### GET `/api/stats`
Estatísticas do sistema
```json
{
  "success": true,
  "data": {
    "customers": 150,
    "orders": 45,
    "messages": 1200,
    "uptime": "24/7",
    "region": "Global"
  }
}
```

## 🗄️ Estrutura do Banco

### Tabelas Principais

#### `customers`
- `id` - ID único
- `phone` - Número do WhatsApp
- `name` - Nome do cliente
- `status` - Status (active/inactive)
- `last_seen` - Última interação

#### `products`
- `id` - ID único
- `name` - Nome do produto
- `price` - Preço em Real
- `description` - Descrição
- `stock` - Estoque disponível

#### `orders`
- `id` - ID único
- `order_number` - Número do pedido (RC123456)
- `customer_phone` - Telefone do cliente
- `total_amount` - Valor total
- `status` - Status do pedido

#### `messages`
- `id` - ID único
- `from_phone` - Remetente
- `to_phone` - Destinatário
- `content` - Conteúdo da mensagem
- `direction` - incoming/outgoing

## 🎨 Dashboard

Acesse o dashboard em: `https://seu-worker.workers.dev/`

### Funcionalidades:
- 📊 **Estatísticas em Tempo Real**
- 🛍️ **Gestão de Produtos**
- 👥 **Lista de Clientes**
- 💬 **Teste de Mensagens**
- ⚙️ **Status do Sistema**

## ⚙️ Configuração Avançada

### Variáveis de Ambiente
```toml
[env.production.vars]
ENVIRONMENT = "production"
COMPANY_NAME = "Royal Club"
WEBHOOK_SECRET = "seu_webhook_secret"
```

### Secrets das APIs
Configure usando Wrangler CLI:
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put META_APP_ID
wrangler secret put META_APP_SECRET
wrangler secret put META_MARKETING_API
wrangler secret put META_ACCESS_TOKEN
```

### Domínio Customizado
```bash
wrangler route add "bot.seusite.com/*" whatsapp-business-bot
```

## 🔧 Comandos Úteis

```bash
# Deploy
npm run deploy

# Desenvolvimento local
npm run dev

# Migrar banco
npm run db:migrate

# Ver logs
npm run logs

# Listar domínios
npm run domains
```

## 📈 Performance

- **Latência**: <50ms global
- **Uptime**: 99.99%
- **Escalabilidade**: Ilimitada
- **Regiões**: 200+ datacenters
- **Requests**: Milhões por segundo

## 🔒 Segurança

- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Rate limiting automático
- ✅ Webhook secrets
- ✅ Logs de auditoria

## 🛠️ Desenvolvimento

### Estrutura de Arquivos
```
whatsapp-business-automation/
├── worker.js              # Worker principal
├── wrangler.toml          # Configuração Cloudflare
├── schema.sql             # Schema do banco
├── deploy.sh              # Script de deploy
├── package.json           # Dependências
├── public/
│   └── index.html         # Dashboard
└── README.md              # Documentação
```

### Adicionando Novos Produtos
```sql
INSERT INTO products (name, description, price, category, stock) 
VALUES ('Novo Produto', 'Descrição', 50.00, 'Categoria', 100);
```

### Personalizando Respostas
Edite o método `generateAutoResponse()` em `worker.js`:

```javascript
if (messageText.includes('palavra-chave')) {
    return 'Sua resposta personalizada';
}
```

## 🤝 Suporte

- 📧 **Email**: contato@royalclub.com.br
- 📱 **WhatsApp**: (67) 99999-9999
- 🌐 **Site**: royalclub.com.br

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para Royal Club**  
*Powered by Cloudflare Workers* ⚡

## 🔄 Changelog

### v2.0.0 (Atual)
- ✅ Migração para Cloudflare Workers
- ✅ Dashboard moderno com Alpine.js
- ✅ Sistema de pedidos completo
- ✅ Performance global <50ms
- ✅ Escalabilidade infinita

### v1.0.0
- ✅ Sistema local Node.js
- ✅ Bot básico WhatsApp
- ✅ Banco SQLite local

## 🎯 Roadmap

- [ ] Integração com PIX
- [ ] Pagamentos por cartão
- [ ] Relatórios avançados
- [ ] Multi-idiomas
- [ ] API de terceiros
- [ ] Webhooks customizados

---

> **Nota**: Este sistema foi desenvolvido especificamente para Royal Club com foco em performance, escalabilidade e facilidade de uso. Para suporte técnico, entre em contato através dos canais oficiais.
