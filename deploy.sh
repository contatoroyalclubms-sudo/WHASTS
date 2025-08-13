#!/bin/bash

echo "🚀 INICIANDO DEPLOY NA CLOUDFLARE..."

if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI não encontrado. Instalando..."
    npm install -g wrangler
fi

echo "🔐 Verificando autenticação..."
wrangler whoami || wrangler login

echo "📦 Criando KV Namespace..."
KV_ID=$(wrangler kv:namespace create "WHATSAPP_KV" --preview false | grep -o "id.*" | cut -d'"' -f4)
echo "✅ KV Namespace criado: $KV_ID"

echo "🗄️ Criando banco D1..."
DB_OUTPUT=$(wrangler d1 create whatsapp-business)
DB_ID=$(echo "$DB_OUTPUT" | grep -o "database_id.*" | cut -d'"' -f4)
echo "✅ Banco D1 criado: $DB_ID"

echo "📋 Executando schema do banco..."
wrangler d1 execute whatsapp-business --file=./schema.sql

echo "⚙️ Atualizando configuração..."
sed -i "s/sua_kv_namespace_id/$KV_ID/g" wrangler.toml
sed -i "s/sua_database_id/$DB_ID/g" wrangler.toml

echo "🌐 Fazendo deploy do Worker..."
wrangler deploy

read -p "🌍 Deseja configurar domínio customizado? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Digite seu domínio (ex: bot.seusite.com): " DOMAIN
    wrangler route add "$DOMAIN/*" whatsapp-business-bot
    echo "✅ Rota configurada para $DOMAIN"
fi

echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "📋 Informações do deploy:"
echo "🌐 Worker URL: https://whatsapp-business-bot.SEU-SUBDOMINIO.workers.dev"
echo "📦 KV Namespace ID: $KV_ID"
echo "🗄️ Database ID: $DB_ID"
echo ""
echo "🔗 Endpoints disponíveis:"
echo "   GET  / - Status do serviço"
echo "   GET  /health - Health check"
echo "   POST /webhook/whatsapp - Webhook para mensagens"
echo "   POST /api/send - Enviar mensagem"
echo "   GET  /api/products - Listar produtos"
echo "   GET  /api/stats - Estatísticas"
echo ""
echo "📱 Configure seu webhook do WhatsApp para:"
echo "   https://whatsapp-business-bot.SEU-SUBDOMINIO.workers.dev/webhook/whatsapp"
