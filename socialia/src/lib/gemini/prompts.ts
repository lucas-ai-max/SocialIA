export function buildImagePrompt(params: {
  userPrompt?: string;
  niche: string;
  visualStyle: string;
  colorPalette?: string[];
  imageFormat: "square" | "portrait";
  headline?: string;
  subheadline?: string;
}): string {
  const topic = params.userPrompt || `conteudo para o nicho de ${params.niche}`;

  const headlineText = params.headline
    ? `Inclua o texto "${params.headline}" como headline principal em destaque.`
    : "Inclua uma headline curta e impactante em destaque na imagem.";

  const subheadlineText = params.subheadline
    ? `Inclua o texto "${params.subheadline}" como subheadline complementar.`
    : "";

  const colorNote = params.colorPalette?.length
    ? `Use estas cores predominantes: ${params.colorPalette.join(", ")}.`
    : "";

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

  return `Crie uma imagem de POST para Instagram no formato 1080x1350px (vertical 4:5).

TEMA: ${topic}

ESTILO VISUAL OBRIGATORIO:
- ${styleDesc}
- FOTOGRAFIA REALISTA de alta qualidade, como uma foto profissional real
- Pessoas reais, ambientes reais, objetos reais - NADA de ilustracao, cartoon ou arte digital
- Iluminacao natural ou de estudio profissional, com profundidade de campo cinematografica
- Textura e detalhes fotograficos: poros da pele, reflexos nos olhos, tecidos reais
- Paleta com tons terrosos/quentes (ocre, dourado, marrom) OU tons frios (azulados, cinzentos) dependendo da emocao
- Saturacao baixa a moderada, como fotografia editorial de revista
${colorNote}

TIPOGRAFIA NA IMAGEM:
- ${headlineText}
${subheadlineText}
- Fonte sem serifa, legivel, peso medio a negrito
- Titulo em caixa alta ou com enfase em palavras-chave por cor ou peso
- Texto sobreposto na foto com boa legibilidade (usar sombra sutil ou area de respiro)
- Diagramacao limpa, alinhamento central ou a esquerda

COMPOSICAO:
- Composicao simetrica e centralizada
- Sujeito principal ao centro ou em proporcoes equilibradas
- Respiro visual adequado para o texto sobreposto
- Foco na expressao corporal e gestual das pessoas
- Narrativa clara e emocionalmente acessivel

REGRAS:
- Formato VERTICAL 1080x1350px
- FOTORREALISMO OBRIGATORIO - deve parecer uma foto real tirada por fotografo profissional
- NAO gere ilustracoes, arte digital, cartoon, 3D ou qualquer estilo nao-fotografico
- A imagem deve parecer um post real e profissional de Instagram
- O texto deve ser LEGIVEL e integrado ao design com boa sobreposicao
- NAO use mockups de celular`;
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

  return `Voce e um copywriter especializado em headlines para posts de Instagram no estilo editorial.

TEMA: ${topic}
NICHO: ${params.niche}
PUBLICO: ${params.targetAudience}

Crie:
1. HEADLINE: frase curta de impacto simbolico com leveza (maximo 8 palavras, em caixa alta)
2. SUBHEADLINE: reflexao complementar ou provocacao estrategica (maximo 15 palavras)

A headline deve ser provocativa, direta e despertar curiosidade.
A subheadline deve complementar com insight ou reflexao.

Responda EXATAMENTE neste formato JSON:
{"headline": "TEXTO DA HEADLINE", "subheadline": "texto da subheadline"}

Responda APENAS com o JSON, sem explicacoes.`;
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
