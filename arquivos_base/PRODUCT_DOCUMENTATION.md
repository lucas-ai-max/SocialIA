# 📱 SocialIA - Documentação Completa do Produto

## 1. O QUE É O SOCIALÍA?

SocialIA é uma **plataforma de inteligência artificial para criação e gerenciamento de conteúdo no Instagram** que permite que pequenos negócios, influenciadores e criadores de conteúdo gerem posts profissionais de forma rápida, fácil e acessível.

### Descrição Executiva

SocialIA revoluciona a forma como criar conteúdo para Instagram através de tecnologia de IA avançada. A plataforma automatiza o processo completo de criação de posts – desde a geração de imagens até a produção de legendas otimizadas com hashtags relevantes – tudo isso em poucos segundos. Não é necessário ser designer gráfico, copywriter ou especialista em marketing digital. Qualquer pessoa pode criar posts de qualidade profissional.

### Visão do Produto

**"Democratizar a criação de conteúdo profissional para Instagram, permitindo que qualquer negócio tenha uma presença visual impactante, sem necessidade de conhecimentos técnicos ou investimento em equipes criativas."**

---

## 2. COMO FUNCIONA?

### 2.1 Fluxo de Funcionamento Principal

O SocialIA funciona em **3 etapas simples**:

#### **ETAPA 1: Conexão com Instagram**
- Usuário se cadastra e realiza login
- Conecta sua conta Instagram Business
- A plataforma valida a conexão através da API do Facebook
- Recebe acesso a dados essenciais (nome de usuário, foto de perfil)

#### **ETAPA 2: Onboarding (Configuração de Marca)**
- Usuário responde um **mini-questionário sobre sua marca** que inclui:
  - Segmento/nicho de negócio
  - Público-alvo principal
  - Tom de voz e estilo visual preferido
  - Objetivos do Instagram (engajamento, vendas, awareness, etc.)
- Essa informação é armazenada e usada para personalizar toda geração de conteúdo futura
- O sistema aprende preferências do usuário

#### **ETAPA 3: Criação de Posts (Dois Modos Disponíveis)**

##### **Modo AUTO (Totalmente Automático)**
- Usuário clica em "Gerar Post Automaticamente"
- A IA, baseada no perfil criado no onboarding, gera:
  - **Imagem única e original** (usando Google Gemini)
  - **Legenda envolvente com hashtags otimizadas**
  - Tudo em segundos
- Usuário pode revisar e editar antes de publicar
- Ideal para quem quer máxima conveniência

##### **Modo PROMPT (Com Controle Criativo)**
- Usuário descreve detalhadamente o que quer no post
- Pode fazer upload de **imagens de referência** para manter identidade visual
- Pode escolher **formato de imagem** (quadrada ou retrato)
- Opção de aparecer na imagem (usa foto de perfil como referência)
- A IA gera:
  - Imagem baseada no prompt e referências
  - Legenda personalizada com hashtags
- Oferece máximo controle criativo

### 2.2 Após a Geração

Depois que a IA gera o post, o usuário entra na **tela de preview** onde pode:

- ✏️ **Editar a legenda** completamente
- #️⃣ **Editar hashtags** individuais
- 🔄 **Regenerar apenas a imagem** (mantendo a legenda)
- 🔄 **Regenerar apenas a legenda** (mantendo a imagem)
- 📅 **Agendar publicação** para data/hora específica
- 💾 **Salvar como rascunho** para editar depois
- ✅ **Publicar direto no Instagram**

### 2.3 Sistema de Créditos

- **1 Crédito = 1 Post** (imagem + legenda gerada)
- Usuários recebem **3 créditos gratuitos** ao se cadastrar
- Créditos são renovados mensalmente via assinatura (processada pela Kiwify):
  - **Starter**: 15 créditos/mês por R$29,90 (R$1,99 por post)
  - **Pro**: 50 créditos/mês por R$59,90 (R$1,20 por post) ⭐ Mais Vendido
  - **Business**: 150 créditos/mês por R$99,90 (R$0,67 por post)
- Assinatura mensal com renovação automática
- Cancelamento e alteração pela área do cliente Kiwify

### 2.4 Recursos Adicionais

#### **Dashboard/Painel de Controle**
- Visualiza todos os posts criados (rascunhos, agendados, publicados)
- Estatísticas básicas de performance
- Histórico de gerações
- Acesso rápido para editar posts

#### **Calendário**
- Visualiza posts agendados em calendário visual
- Vê data/hora de publicação programada
- Pode rearranjar datas facilmente
- Planejamento visual da estratégia de conteúdo

#### **Autopilot (IA Contínua)**
- Modo experimental/futuro
- Gera posts automaticamente em intervalo definido pelo usuário
- Publica automaticamente no horário ideal
- Ideal para manter presença consistente

#### **Configurações**
- Gerenciar dados da marca
- Editar preferências de IA
- Histórico de transações/compras de créditos
- Plano de cobrança (Kiwify integrado)

### 2.5 Tecnologias Utilizadas

- **Geração de Imagens**: Google Gemini 3 Pro Image (preview)
- **Geração de Texto**: OpenAI GPT-4.1 mini (legendas, hashtags e ideias em pt-BR)
- **Integração Instagram**: Meta Graph API (Facebook Business)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Frontend**: Next.js 16 + React 19
- **Estilo**: TailwindCSS
- **Pagamentos**: Kiwify
- **Autenticação**: Supabase Auth

---

## 3. PARA QUEM SERVE?

### 3.1 Públicos Ideais (Alto Fit)

#### 🏪 **Pequenos Negócios Locais**
- Restaurantes, cafés, bares
- Salões de beleza, academias
- Lojas de roupas, acessórios
- Consultórios (odontologia, fisioterapia)
- Serviços locais em geral

**Por quê**: Não têm orçamento para agência de design. Precisam postar regularmente mas não sabem como. SocialIA democratiza acesso a conteúdo profissional.

#### 👤 **Influenciadores e Criadores de Conteúdo**
- Micro e nano-influenciadores
- Creators iniciando carreira
- Bloggers em crescimento

**Por quê**: Precisam produzir muito conteúdo regularmente. Reduz tempo de produção em 90%. Podem focar em qualidade e estratégia ao invés de criação manual.

#### 📸 **Fotógrafos e Videógrafos**
- Podem usar para criar conteúdo de seus portfólios
- Gerar posts sobre serviços
- Não é concorrência – é ferramenta complementar

**Por quê**: Adiciona mais uma oferta de serviço. Reduz tempo ocioso.

#### 🛍️ **E-commerce e Marketplaces**
- Lojistas iniciantes ou em crescimento
- Vendedores que não têm designer próprio
- Pequenas marcas D2C

**Por quê**: Precisam gerar muitas imagens de produtos. SocialIA acelera processo mantendo consistência visual.

#### 💼 **Consultores e Profissionais Autônomos**
- Personal trainers, nutricionistas, coaches
- Consultores de negócios
- Profissionais liberais

**Por quê**: Precisam manter presença online relevante. SocialIA permite postar sem afastar do trabalho principal.

#### 🎯 **Agências de Marketing (como ferramenta)**
- Agências pequenas/médias
- Freelancers de marketing

**Por quê**: Acelera delivery de projetos. Reduz custos operacionais. Permite usar resources em estratégia vs. execução.

#### 🚀 **Startups em Fase Inicial**
- Bootstrapped ou com seed recente
- Sem orçamento para estrutura criativa

**Por quê**: Precisam fazer mais com menos. SocialIA oferece profissionalismo sem custo de agência.

#### 🌟 **Marcas Emergentes (D2C)**
- Novos produtos em teste de mercado
- Pequenos fabricantes
- Artesãos digitalizando

**Por quê**: Precisam de visibilidade. Conteúdo visual impactante diferencia no Instagram.

### 3.2 Características do Cliente Ideal

**Aquele que...**
- ✅ Reconhece importância do Instagram para seu negócio
- ✅ Tem dificuldade ou aversão a tarefas criativas/design
- ✅ Quer postar regularmente mas falta tempo
- ✅ Não tem orçamento para designer ou agência
- ✅ Quer qualidade profissional acessível
- ✅ Vê conteúdo visual como essencial mas não core business
- ✅ Valoriza eficiência e rapidez
- ✅ Conecta sua conta Instagram Business sem receios
- ✅ Está disposto a iterar/refinar outputs da IA

---

## 4. PARA QUEM NÃO SERVE?

### 4.1 Públicos com Baixo Fit

#### ❌ **Designers e Agências Criativas**
- Profissionais que vendem criatividade como core business
- Agências full-service

**Por quê**: SocialIA substituiria seus serviços criativos, não complementaria. Conflito direto.

#### ❌ **Grandes Corporações/Multinacionais**
- Empresas Fortune 500
- Grandes marcas consolidadas

**Por quê**: Possuem equipes criativas próprias. Precisam de personalizações complexas. Não faz sentido economicamente.

#### ❌ **Conteúdo Altamente Especializado**
- Fotógrafos que vendem fotos artísticas/editorial
- Artistas digitais
- Ilustradores profissionais

**Por quê**: Seu valor está na criatividade original, não na eficiência. IA generativa não substitui.

#### ❌ **Negócios que Vendem Apenas Serviços Intangíveis**
- Consultoria estratégica de alto valor
- Cursos online premium
- Coaching executivo para C-level

**Por quê**: Instagram pode não ser channel prioritário. Geralmente usam LinkedIn ou email marketing.

#### ❌ **Marcas que Precisam de Identidade Visual Ultra-Específica**
- Luxury brands
- Marcas com guidelines gráficos rígidos
- Fashion brands com direção criativa complexa

**Por quê**: IA ainda não consegue replicar nuances criativas requintadas. Outputs podem não alinhar 100% com brand guidelines.

#### ❌ **Usuários Sem Conta Instagram Business Conectada**
- Aqueles que recusam compartilhar acesso
- Usuários com contas pessoais apenas
- Accounts bloqueados pelo Instagram

**Por quê**: A plataforma depende de acesso autorizado para publicar automaticamente.

#### ❌ **Criadores que Vendem Fotografia/Vídeo**
- Produtoras de conteúdo audiovisual
- Cineastas
- Videógrafos profissionais

**Por quê**: Seu diferencial é qualidade de produção original.

#### ❌ **Empresas B2B Complexas**
- Software as a Service (SaaS)
- Produtos industriais
- Serviços enterprise

**Por quê**: Instagram é channel visual/aspiracional. B2B complex geralmente prefere LinkedIn, webinars, case studies.

#### ❌ **Usuários que Precisam de Conteúdo 100% Original/Único**
- Artistas procrastinadores querendo evitar criatividade
- Aqueles que só aceitam conteúdo totalmente handmade

**Por quê**: SocialIA gera conteúdo original mas com "estilo IA" detectável por alguns. Não para puristas.

#### ❌ **Negócios com Orçamento Zero**
- Empreendedores falidos
- Pessoas em situação financeira precária

**Por quê**: Embora acessível (a partir de R$29,90/mês), requer investimento. Não é gratuito além dos 3 créditos iniciais.

#### ❌ **Usuários com Conexão Internet Ruim/Intermitente**
- Regiões com internet precária
- Gerações de IA exigem uploading de imagens

**Por quê**: Plataforma é cloud-based. Gerações falham com conectividade ruim.

### 4.2 Cenários Específicos de Não-Fit

| Cenário | Motivo |
|---------|--------|
| **Conteúdo Sensível/Polêmico** | IA pode gerar outputs inapropriados. Requer revisão manual pesada. |
| **Linguagem/Idioma Especializado** | SocialIA otimizado para português. Sem suporte para outras línguas nativamente. |
| **Conteúdo Legal/Compliance Heavy** | Indústria financeira, farmacêutica exigem aprovações específicas. |
| **Conteúdo 100% Real/Documental** | Eventos reais, fotos do dia-a-dia da marca. IA gera ilustrações, não captura momentos reais. |
| **Estratégia Cross-Platform** | SocialIA = Instagram only. Não gera para TikTok, YouTube, LinkedIn. |
| **Community Management** | Plataforma = geração. Não gerencia comentários, DMs, engajamento. |
| **Analytics & Reporting** | Foco em criação. Analytics básicos apenas. Não substitui Sprout Social/Buffer. |

---

## 5. PROPOSTA DE VALOR RESUMIDA

### O Que Resolve?
1. **Falta de Tempo**: Cria posts em minutos (não horas/dias)
2. **Falta de Habilidade**: Não precisa saber design ou copywriting
3. **Falta de Recursos**: Sem orçamento para agência ou designer
4. **Falta de Consistência**: Fácil postar regularmente
5. **Falta de Criatividade**: IA gera ideias e executa

### Diferenciadores
- ✅ **Preço**: Planos acessíveis a partir de R$29,90/mês
- ✅ **Créditos Inclusos**: 15 a 150 posts por mês, conforme plano
- ✅ **Dois Modos**: Auto ou com controle criativo
- ✅ **Edição Total**: Revise tudo antes de publicar
- ✅ **Agendamento**: Agende e esqueça
- ✅ **Referências Visuais**: Mantenha identidade da marca
- ✅ **Prototipagem Rápida**: Teste ideias em segundos

---

## 6. MODELOS DE RECEITA

### Modelo de Monetização Atual
- **Assinatura mensal** via Kiwify (primary)
  - Margens altas (custo de IA é baixo)
  - Receita recorrente previsível
  - Três níveis (Starter/Pro/Business) para maximizar ARPU

### Oportunidades Futuras
- **Plano Premium/Subscription** (Autopilot avançado, analytics, etc.)
- **Integração com Shopify/WooCommerce** (e-commerce optimization)
- **White Label** (para agências)
- **API Partners** (para terceiros integrar SocialIA)

---

## 7. MÉTRICAS DE SUCESSO (Para o Agente)

Quando presentar a um cliente, foque em:

### Métricas de Eficiência
- ⏱️ **Tempo de Criação**: De 30-60 min para 2-3 minutos
- 🎯 **Produtividade**: 4-5 posts/hora possível
- 💰 **Custo por Post**: R$1,99-R$0,67 (vs R$200+ agência)

### Métricas de Qualidade
- 🎨 **Profissionalismo**: Output de designer profissional
- 🔤 **Copy**: Legendas envolventes com CTAs
- #️⃣ **Hashtags**: Otimizadas para alcance (vs. aleatórias)

### Métricas de Negócio
- 📈 **Consistência**: Postar 3-4x/semana fica viável
- 🎯 **Relevância**: IA entende negócio/público do usuário
- 📊 **Escalabilidade**: Criar conteúdo em batch/mês

---

## 8. LINGUAGEM & TONE PARA APRESENTAÇÃO

### Ao Apresentar, Use:
- **Tom**: Entusiasmado mas confiável (não oversell)
- **Linguagem**: Simples, evite jargão técnico IA
- **Foco**: Benefícios (economizar tempo/dinheiro), não features
- **Prova Social**: "Pequenos negócios já estão usando"
- **Call-to-Action**: "Comece com 3 créditos grátis"

### Phrasing Recomendado
✅ "Criar posts profissionais em minutos"
✅ "Sem necessidade de saber design"
✅ "Pague por post, não por assinatura"
✅ "Imagens únicas + legendas otimizadas"
✅ "Mantenha consistência visual da sua marca"

❌ Evitar: "Generative AI powered platform"
❌ Evitar: "Leveraging neural networks"
❌ Evitar: "Enterprise-grade solution"

---

## 9. PERGUNTAS FREQUENTES (FAQ)

### Q: A IA gera imagens que parecem "geradas por IA"?
**A**: Gemini é avançado em fotografia realista. Varía bastante, mas normalmente produz imagens profissionais que não parecem "artificiais" no sentido negativo.

### Q: Posso editar a imagem após geração?
**A**: Não na plataforma, mas você pode fazer download e editar em qualquer editor. Oferecemos "regenerate image" se quiser nova versão.

### Q: Quanto tempo a geração leva?
**A**: 15-45 segundos normalmente. Depende de API response times (Google Cloud).

### Q: Quantas vezes posso regenerar?
**A**: Cada regenerate = 1 crédito. Pode regenerar quantas vezes quiser (com créditos).

### Q: Qual a qualidade de hashtags?
**A**: SocialIA gera hashtags relevantes baseado no contexto, mas recomendamos revisar/ajustar conforme histórico de engagement sua conta.

### Q: Funciona com Instagram pessoal?
**A**: Não, precisa ser Business Account vinculada a Página Facebook.

### Q: Posso usar imagens de terceiros como referência?
**A**: Sim, upload na seção "Reference Upload". IA usa como style reference.

### Q: Os créditos têm validade?
**A**: Os créditos mensais de cada plano renovam a cada ciclo de cobrança. Créditos não utilizados no mês não acumulam para o próximo.

### Q: Preciso estar noBrasil para usar?
**A**: Não, qualquer país com Instagram Business funciona. Mas legendas/sugestões em português.

### Q: Como funciona o agendamento?
**A**: Você escolhe data/hora, SocialIA envia para Instagram agendada. Publica automaticamente.

---

## 10. CASOS DE USO ESPECÍFICOS

### Caso 1: Restaurante em São Paulo
**Problema**: Postar "algo" 3x/semana mas sem designer
**Solução SocialIA**:
- Gera foto do prato com descrição apetitosa
- Hashtags locais incluídas
- 5 posts/semana agora viável
- Custo: a partir de R$29,90/mês vs R$500+ freelancer

### Caso 2: Personal Trainer
**Problema**: Quer postar dicas mas sem tempo de design
**Solução SocialIA**:
- Prompt: "Dica de alongamento para coluna, estilo fitness"
- IA gera imagem + caption em 2min
- 4-5 posts/semana agora factível
- Engagement aumenta com consistência

### Caso 3: Loja de Roupas Online
**Problema**: Muitos SKUs mas sem visual consistente
**Solução SocialIA**:
- Upload foto do produto + "estilo boho chic"
- IA gera lifestyle shot
- Batch cria 10 posts/dia para estoque
- Consistência visual mantida

### Caso 4: Freelancer de Design
**Problema**: Quer mostrar trabalho mas sem tempo de portfolio
**Solução SocialIA**:
- Gera "estudos de caso" visuais
- Posta 3x/semana com insights
- Diferencia expertise humana + IA literacy
- Complementa (não compete com serviço de design)

---

## 11. OBJECTIONS HANDLING (Para o Agente)

| Objeção | Resposta |
|---------|----------|
| "IA não é criativa o bastante" | "Você controla totalmente via prompts e referências. É colaboração, não substituição." |
| "Medo de parecer robótico" | "Imagens são únicas, legendas customizáveis 100%. Você revisa antes de publicar." |
| "Não tenho orçamento" | "3 créditos grátis = teste sem risco. Planos a partir de R$29,90/mês. Se economizar 4h/mês em design, ROI é óbvio." |
| "Meu público espera autenticidade" | "Conteúdo 100% você. IA só é ferramenta execução. Autenticidade = sua voz, seu negócio." |
| "Prefiro outsource para agência" | "Isso funciona, mas SocialIA reduz custo em 95% se quiser fazer internamente." |
| "Complexo demais de usar" | "3 cliques: descrever ideia + revisar + agendar. Testável em 5 minutos." |

---

## 12. MÉTRICA DE ONBOARDING IDEAL

O usuário ideal será **onboarded com sucesso** se:
1. ✅ Conectou Instagram Business
2. ✅ Respondeu questionário de marca
3. ✅ Criou 3-5 posts (usando créditos grátis)
4. ✅ Agendou pelo menos 1 post
5. ✅ Estava satisfeito com resultado

**Se tudo isso ocorre**: Alta chance de re-compra de créditos.

---

## 13. POSICIONAMENTO COMPETITIVO

### vs. Agências de Design
- ✅ 95% mais barato
- ✅ 100x mais rápido
- ❌ Menos customização complexa

### vs. Ferramentas como Buffer/Sprout Social
- ✅ Cria conteúdo (não apenas agenda)
- ❌ Menos analytics
- ❌ Menos CMS features

### vs. IA Genéricas (ChatGPT, Gemini)
- ✅ Pipeline completo (imagem + texto)
- ✅ Otimizado para Instagram
- ✅ Agendamento integrado
- ❌ Menos flexível em uso

### vs. Canva
- ✅ Geração IA nativa
- ✅ Mais rápido para instagram
- ❌ Canva = edição manual ainda necessária
- ❌ Menos específico para conteúdo

---

## Conclusão

**SocialIA é para**: Qualquer negócio que precisa de presença visual consistente no Instagram mas não tem tempo, habilidade ou orçamento para contratar.

**SocialIA NÃO é para**: Agências criativas, grandes corporações, ou negócios que vendem criatividade original como core business.

**Você deve apresentar SocialIA quando o cliente menciona**:
- Dificuldade em postar regularmente
- Falta de designer ou orçamento limitado
- Desejo de conteúdo visual profissional
- Tempo limitado
- Importância do Instagram para o negócio

**Você deve recomendar alternativas quando o cliente for**:
- Agência criativa
- Multinacional com equipe própria
- Focused em conteúdo artístico/editorial puro
