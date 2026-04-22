export function buildImagePrompt(params: {
  userPrompt?: string;
  niche: string;
  visualStyle: string;
  colorPalette?: string[];
  imageFormat: "square" | "portrait";
  headline?: string;
  subheadline?: string;
  hasBrandLogo?: boolean;
}): string {
  const topic = params.userPrompt || `conteudo para o nicho de ${params.niche}`;

  const brandColors = params.colorPalette?.length ? params.colorPalette : null;
  const primaryColor = brandColors?.[0] || null;
  const accentColor = brandColors?.[1] || brandColors?.[0] || null;

  const colorNote = brandColors
    ? `PALETA DE CORES DA MARCA (usar em toda a imagem e tipografia): ${brandColors.join(", ")}.`
    : "";

  const textColorGuide = brandColors
    ? `CORES DO TEXTO — USE A PALETA DA MARCA (PROIBIDO texto 100% branco puro):
- HEADLINE: use a cor ${primaryColor} (cor primaria da marca) como COR PRINCIPAL da headline. Se o contraste ficar ruim sobre o fundo, escureca/clareia ${primaryColor} o necessario, mas MANTENHA o tom da marca.
- SUBHEADLINE: use ${accentColor} (cor acento) ou uma versao clara/neutra derivada da paleta.
- Voce PODE destacar palavras-chave da headline em ${accentColor} enquanto o resto fica em ${primaryColor} — isso cria hierarquia visual e refoca a leitura.
- NAO use branco puro (#FFFFFF) — use tons da paleta ${brandColors.join(" / ")}.
- O texto faz parte do BRANDING VISUAL e deve estar integrado a paleta, nao sobreposto.`
    : `CORES DO TEXTO (escolha tom complementar do ambiente — NAO use branco puro):
- Extraia uma cor da paleta da propria cena (dourado do por-do-sol, azul do ceu, ambar da luz, etc.)
- Headline em cor vibrante e contrastante (nunca branco 100%)
- Subheadline em versao mais clara/dessaturada da mesma cor`;

  const styleMap: Record<string, string> = {
    minimalist:
      "estilo minimalista editorial, composicao limpa com bastante respiro visual, iluminacao difusa e suave",
    vibrant:
      "estilo editorial vibrante, cores quentes e saturadas com contrastes emocionais, iluminacao dramatica lateral",
    dark: "estilo editorial escuro e sofisticado, tons profundos com acentos de luz quente, atmosfera introspectiva",
    clean:
      "estilo editorial clean e moderno, composicao simetrica e equilibrada, iluminacao neutra e profissional",
  };

  const styleDesc = styleMap[params.visualStyle] || styleMap.vibrant;

  // Boas praticas para renderizar texto em imagens com IA:
  // 1. Texto literal com aspas triplas no topo do prompt (prioridade maxima)
  // 2. Em portugues brasileiro, copiar caractere por caractere
  // 3. Proibir traducao, invencao, abreviacao, troca de letras
  // 4. Especificar tipografia clara (fonte, peso, kerning)
  const hasHeadline = !!params.headline;
  const hasSubheadline = !!params.subheadline;

  const textBlock = hasHeadline
    ? `TEXTO A RENDERIZAR NA IMAGEM (em portugues do Brasil, letra por letra, SEM aspas, SEM erros):

HEADLINE (CAIXA ALTA, grande):
${params.headline}

${hasSubheadline ? `SUBHEADLINE (caixa normal, menor):\n${params.subheadline}` : "NAO inclua subheadline — apenas a headline."}

REGRAS CRITICAS DO TEXTO (NAO VIOLAR):
- NAO inclua aspas (" ' « » ‟) ou pontuacao extra ao redor do texto
- Renderize EXATAMENTE o texto acima, caractere por caractere, incluindo acentos
- NAO altere, traduza, abrevie, ou invente letras
- NAO adicione texto extra
- Preserve todos os acentos portugueses (a, e, i, o, u, c)
- Exemplos de erros proibidos: "vredade" (certo: "verdade"), "alinam" (certo: "alinham"), "serenridade" (certo: "serenidade")
- Se uma palavra parecer estranha, MANTENHA o texto acima (ja esta correto em pt-BR)
- PREFIRA renderizar menos texto do que texto com erros`
    : `TEXTO: NAO inclua texto na imagem.`;

  return `Crie uma imagem de POST para Instagram (formato vertical 4:5, 1080x1350px).

${textBlock}

TIPOGRAFIA (seguir rigorosamente):
- Fonte sans-serif moderna, limpa, muito legivel (ex: Inter, Montserrat, Helvetica Neue)
- Headline em CAIXA ALTA, peso Bold ou Black
- Subheadline em peso Regular ou Medium, tamanho cerca de 40% da headline
- Alinhamento CENTRALIZADO
- Sombra sutil escura atras do texto ou overlay escuro suave na area do texto para legibilidade
- Tracking/letter-spacing normal (NUNCA muito apertado, NUNCA muito largo)
- Kerning perfeito, NENHUMA letra colidindo com outra
- Todas as linhas de texto dentro da area segura (margem de 10% de cada lado)
- Texto NAO pode ultrapassar as bordas da imagem

${textColorGuide}
- A tipografia faz parte da IDENTIDADE VISUAL da marca — cores devem se integrar com o ambiente/cena
- O texto nao deve parecer "colado por cima" em branco padrao — precisa conversar com a paleta
- IMPORTANTE: rejeite branco puro como cor principal do texto

TEMA DA CENA: ${topic}

ESTILO VISUAL:
- ${styleDesc}
- FOTOGRAFIA REALISTA de alta qualidade, foto profissional de revista
- Pessoas reais, ambientes reais, objetos reais — SEM ilustracao, cartoon ou 3D
- Iluminacao natural ou de estudio, profundidade de campo cinematografica
- Textura fotografica: poros, reflexos, tecidos reais
- Saturacao baixa a moderada, paleta coerente
${colorNote}

COMPOSICAO:
- Texto NA METADE SUPERIOR da imagem (centralizado)
- Sujeito principal no centro ou parte inferior
- Regra dos tercos, respiro visual para o texto
- Narrativa clara e emocionalmente acessivel

${params.hasBrandLogo ? `LOGOTIPO DA MARCA (CRITICO):
- A PRIMEIRA imagem de referencia fornecida e o LOGOTIPO da marca
- Inclua o logotipo de forma discreta e elegante na composicao final (canto inferior direito, por padrao)
- Tamanho: aproximadamente 10-15% da largura da imagem, com respiro em volta
- NAO distorca, corte, gire, recolora ou altere o logotipo — preserve formas e cores originais
- Garanta contraste: use sombra sutil ou pequena area clara atras do logo se o fundo competir
- O logo e um elemento de branding, nao o assunto da cena` : ""}

REGRAS FINAIS:
- Formato VERTICAL 1080x1350px (4:5)
- FOTORREALISMO OBRIGATORIO - deve parecer foto real de fotografo profissional
- Texto DEVE estar com ortografia 100% correta em portugues brasileiro
- Texto DEVE caber dentro da imagem (nao cortar nas bordas)
- NAO use mockups de celular, frames ou bordas
- NAO renderize texto decorativo extra alem do especificado`;
}

export function buildCaptionPrompt(params: {
  userPrompt?: string;
  niche: string;
  targetAudience: string;
  brandVoice: string;
  contentPillars: string[];
  additionalContext?: string;
}): string {
  const voiceMap: Record<string, string> = {
    formal: "formal com autoridade e sofisticacao",
    casual: "casual e proximo, com empatia",
    playful: "divertido e leve, com simbolismo",
    professional: "profissional, estrategico e provocativo",
  };

  const voice = voiceMap[params.brandVoice] || voiceMap.professional;

  const topicNote = params.userPrompt
    ? `Tema do post: ${params.userPrompt}`
    : `Escolha um tema relevante entre os pilares de conteudo: ${params.contentPillars.join(", ")}`;

  const contextNote = params.additionalContext
    ? `Contexto adicional: ${params.additionalContext}`
    : "";

  return `Voce e um copywriter e estrategista narrativo especializado em conteudos emocionalmente envolventes para Instagram. Sua missao e traduzir a essencia da marca em legendas que unem apelo emocional, provocacao estrategica e engajamento.

${topicNote}

Perfil da marca:
- Nicho: ${params.niche}
- Publico-alvo: ${params.targetAudience}
- Tom de voz: ${voice}
- Pilares de conteudo: ${params.contentPillars.join(", ")}
${contextNote}

ESTRUTURA DA LEGENDA:
1. ABERTURA EMOCIONAL - Primeira linha que prende atencao com simbolismo ou provocacao sutil
2. DESENVOLVIMENTO REFLEXIVO - 2-3 paragrafos curtos que aprofundam o tema com insights e conexao emocional
3. ENCERRAMENTO COM CTA - Convite a acao (comentar, salvar, compartilhar) de forma natural e nao forcada

REGRAS:
- Escreva em portugues brasileiro
- Maximo 2200 caracteres (limite do Instagram)
- Use linguagem simbolica e emocional com leveza
- Evite expressoes duras, tons agressivos ou apelos polemicos
- Emojis so quando fortalecerem o significado (maximo 3-4 na legenda toda)
- A legenda deve gerar conexao emocional e estimular interacao
- Tom: direto ao ponto, estrategico, provocativo com autoridade
- Foco em resultado pratico, nao teoria
- NAO inclua hashtags no corpo da legenda

Responda APENAS com a legenda, sem explicacoes adicionais.`;
}

export function buildHeadlinePrompt(params: {
  userPrompt?: string;
  niche: string;
  targetAudience: string;
  brandVoice: string;
}): string {
  const topic = params.userPrompt || `conteudo para o nicho de ${params.niche}`;

  return `Voce e um copywriter brasileiro nativo, especializado em headlines para posts de Instagram no estilo editorial. Escreva SEMPRE em portugues brasileiro PERFEITO, com ortografia impecavel.

TEMA: ${topic}
NICHO: ${params.niche}
PUBLICO: ${params.targetAudience}

Crie:
1. HEADLINE: frase curta de impacto simbolico (maximo 6 palavras, em caixa alta)
2. SUBHEADLINE: reflexao complementar (maximo 12 palavras)

REGRAS DE QUALIDADE (CRITICAS):
- Use APENAS palavras reais do dicionario portugues brasileiro
- Ortografia PERFEITA: NAO invente palavras, NAO junte palavras erradas, NAO troque letras
- Exemplos de ERROS proibidos: "serenridade" (errado, o certo e "serenidade"), "acoences" (nao existe), "vredade" (o certo e "verdade"), "alinam" (o certo e "alinham")
- Revise mentalmente cada palavra antes de escrever — se tem duvida sobre uma palavra, escolha uma mais simples
- Prefira palavras comuns e bem conhecidas a palavras sofisticadas com risco de erro
- Use acentuacao correta: cafe, voce, tambem, nao, nao, coracao, acoes, questao
- Evite palavras com letras mudas ou complexas que voce nao tenha certeza da grafia

ESTILO:
- Headline provocativa, direta, desperta curiosidade
- Subheadline complementa com insight ou reflexao
- Tom editorial, estrategico

Responda EXATAMENTE neste formato JSON (uma linha):
{"headline": "TEXTO DA HEADLINE", "subheadline": "texto da subheadline"}

NAO inclua blocos de codigo (\`\`\`json). Responda APENAS o JSON puro.`;
}

export function buildHashtagsPrompt(params: {
  caption: string;
  niche: string;
}): string {
  return `Com base nesta legenda de Instagram e no nicho "${params.niche}", sugira 15-20 hashtags relevantes em portugues brasileiro.

Legenda: ${params.caption}

Regras:
- Mix de hashtags populares e de nicho
- Todas em portugues (exceto termos universais como #marketing, #ia)
- Sem espacos, apenas letras e numeros
- Responda APENAS com as hashtags separadas por espaco, sem explicacoes

Exemplo de formato: #exemplo #hashtag #nicho`;
}

export function buildAutoIdeaPrompt(params: {
  niche: string;
  contentPillars: string[];
  targetAudience: string;
}): string {
  return `Voce e um estrategista de conteudo para Instagram. Sugira UMA ideia de post para o seguinte perfil:

- Nicho: ${params.niche}
- Pilares de conteudo: ${params.contentPillars.join(", ")}
- Publico-alvo: ${params.targetAudience}

Regras:
- A ideia deve ser relevante, engajante e emocionalmente provocativa
- Descreva em uma frase curta e objetiva (maximo 100 caracteres)
- Foque em dores, desejos ou transformacoes do publico-alvo
- Responda APENAS com a ideia, sem explicacoes

Exemplo: "O dia que voce parou de postar por medo de julgamento"`;
}
