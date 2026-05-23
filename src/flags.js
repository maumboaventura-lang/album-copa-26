// Mapa de prefixo de código → emoji de bandeira
// Os códigos são os mesmos usados no álbum oficial Panini Brasil

export const FLAGS = {
  'MEX': '🇲🇽',
  'RSA': '🇿🇦',
  'KOR': '🇰🇷',
  'CZE': '🇨🇿',
  'CAN': '🇨🇦',
  'BIH': '🇧🇦',
  'QAT': '🇶🇦',
  'SUI': '🇨🇭',
  'BRA': '🇧🇷',
  'MAR': '🇲🇦',
  'HAI': '🇭🇹',
  'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸',
  'PAR': '🇵🇾',
  'AUS': '🇦🇺',
  'TUR': '🇹🇷',
  'GER': '🇩🇪',
  'CUW': '🇨🇼',
  'CIV': '🇨🇮',
  'ECU': '🇪🇨',
  'NED': '🇳🇱',
  'JPN': '🇯🇵',
  'SWE': '🇸🇪',
  'TUN': '🇹🇳',
  'BEL': '🇧🇪',
  'EGY': '🇪🇬',
  'IRN': '🇮🇷',
  'NZL': '🇳🇿',
  'ESP': '🇪🇸',
  'CPV': '🇨🇻',
  'KSA': '🇸🇦',
  'URU': '🇺🇾',
  'FRA': '🇫🇷',
  'SEN': '🇸🇳',
  'IRQ': '🇮🇶',
  'NOR': '🇳🇴',
  'ARG': '🇦🇷',
  'ALG': '🇩🇿',
  'AUT': '🇦🇹',
  'JOR': '🇯🇴',
  'POR': '🇵🇹',
  'COD': '🇨🇩',
  'UZB': '🇺🇿',
  'COL': '🇨🇴',
  'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'CRO': '🇭🇷',
  'GHA': '🇬🇭',
  'PAN': '🇵🇦',
}

export function flagFor(code) {
  if (!code) return '🏳️'
  const prefix = code.split(' ')[0].replace(/\d+$/, '')
  if (prefix === 'FWC' || prefix === '00') return '🏆'
  if (prefix === 'CC') return '🥤'
  return FLAGS[prefix] || '🏳️'
}

// Mapa de seção → bandeira (para a lista)
export function flagForSection(sectionName) {
  if (sectionName.startsWith('Abertura')) return '🏆'
  if (sectionName.startsWith('Coca')) return '🥤'
  // Procurar nome do país no início
  for (const [prefix, flag] of Object.entries(FLAGS)) {
    // Mapeamento por nome conhecido
  }
  // Mapa explícito por nome em português
  const byName = {
    'África do Sul': '🇿🇦',
    'Alemanha': '🇩🇪',
    'Arábia Saudita': '🇸🇦',
    'Argélia': '🇩🇿',
    'Argentina': '🇦🇷',
    'Austrália': '🇦🇺',
    'Áustria': '🇦🇹',
    'Bélgica': '🇧🇪',
    'Bósnia-Herzegovina': '🇧🇦',
    'Brasil': '🇧🇷',
    'Cabo Verde': '🇨🇻',
    'Canadá': '🇨🇦',
    'Catar': '🇶🇦',
    'Colômbia': '🇨🇴',
    'Congo DR': '🇨🇩',
    'Coreia do Sul': '🇰🇷',
    'Costa do Marfim': '🇨🇮',
    'Croácia': '🇭🇷',
    'Curaçao': '🇨🇼',
    'Egito': '🇪🇬',
    'Equador': '🇪🇨',
    'Escócia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Espanha': '🇪🇸',
    'França': '🇫🇷',
    'Ghana': '🇬🇭',
    'Haiti': '🇭🇹',
    'Holanda': '🇳🇱',
    'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Irã': '🇮🇷',
    'Iraque': '🇮🇶',
    'Japão': '🇯🇵',
    'Jordânia': '🇯🇴',
    'Marrocos': '🇲🇦',
    'México': '🇲🇽',
    'Noruega': '🇳🇴',
    'Nova Zelândia': '🇳🇿',
    'Panamá': '🇵🇦',
    'Paraguai': '🇵🇾',
    'Portugal': '🇵🇹',
    'Senegal': '🇸🇳',
    'Suécia': '🇸🇪',
    'Suíça': '🇨🇭',
    'Tchéquia': '🇨🇿',
    'Tunísia': '🇹🇳',
    'Türkiye': '🇹🇷',
    'Uruguai': '🇺🇾',
    'USA': '🇺🇸',
    'Uzbequistão': '🇺🇿',
  }
  for (const [nome, flag] of Object.entries(byName)) {
    if (sectionName.startsWith(nome)) return flag
  }
  return '🏳️'
}
