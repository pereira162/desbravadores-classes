/**
 * Catálogo Oficial de Unificações de Classes dos Desbravadores (DSA)
 * Gerado automaticamente com base em /config/unificacoes_requisitos_desbravadores.md
 */

export const unificationsCatalog = {
  "metadata": {
    "title": "Catálogo Unificado Oficial de Classes dos Desbravadores (DSA)",
    "version": "2026.2",
    "source": "/config/unificacoes_requisitos_desbravadores.md",
    "total_requirements": 212,
    "total_unifications": 40,
    "total_unified_requirements": 177,
    "total_isolated_requirements": 35,
    "scenarios": {
      "strict": {
        "total_units": 75,
        "effort_reduction_percentage": 64.6,
        "unifications_count": 40
      },
      "integrated": {
        "total_units": 55,
        "effort_reduction_percentage": 74.1,
        "unifications_count": 41
      }
    }
  },
  "unifications": [
    {
      "id": "U-01",
      "code": "U-01",
      "title": "Idade Mínima (10 a 15 anos)",
      "fullTitle": "Idade Mínima (10 a 15 anos) — *Unificado (6 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "GERAIS",
      "systemRule": "Baixa automática por idade: se `idade_aluno >= idade_classe`, marca concluído.",
      "pedagogicalDetails": "Progressivo automático: cumprir a idade da classe mais avançada (15 anos em Guia) engloba as idades anteriores (10 a 14 anos).",
      "requirementsCount": 6,
      "requirementIds": [
        "AMIGO_I_1",
        "COMPANHEIRO_I_1",
        "PESQUISADOR_I_1",
        "PIONEIRO_I_1",
        "EXCURSIONISTA_I_1",
        "GUIA_I_1"
      ],
      "requirementNums": [
        1,
        35,
        73,
        107,
        141,
        177
      ],
      "requirements": [
        {
          "num": 1,
          "id": "AMIGO_I_1",
          "code": "I.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "I. Gerais (Req. 1)",
          "text": "Ter, no mínimo, 10 anos de idade."
        },
        {
          "num": 35,
          "id": "COMPANHEIRO_I_1",
          "code": "I.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "I. Gerais (Req. 1)",
          "text": "Ter, no mínimo, 11 anos de idade."
        },
        {
          "num": 73,
          "id": "PESQUISADOR_I_1",
          "code": "I.1",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "I. Gerais (Req. 1)",
          "text": "Ter, no mínimo, 12 anos de idade."
        },
        {
          "num": 107,
          "id": "PIONEIRO_I_1",
          "code": "I.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "I. Gerais (Req. 1)",
          "text": "Ter, no mínimo, 13 anos de idade."
        },
        {
          "num": 141,
          "id": "EXCURSIONISTA_I_1",
          "code": "I.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "I. Gerais (Req. 1)",
          "text": "Ter, no mínimo, 14 anos de idade."
        },
        {
          "num": 177,
          "id": "GUIA_I_1",
          "code": "I.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "I. Gerais (Req. 1)",
          "text": "Ter, no mínimo, 15 anos de idade."
        }
      ],
      "specialties": [],
      "hierarchicalScale": [
        {
          "num": 177,
          "id": "GUIA_I_1",
          "label": "15 anos (Guia)",
          "rank": 6
        },
        {
          "num": 141,
          "id": "EXCURSIONISTA_I_1",
          "label": "14 anos (Excursionista)",
          "rank": 5
        },
        {
          "num": 107,
          "id": "PIONEIRO_I_1",
          "label": "13 anos (Pioneiro)",
          "rank": 4
        },
        {
          "num": 73,
          "id": "PESQUISADOR_I_1",
          "label": "12 anos (Pesquisador)",
          "rank": 3
        },
        {
          "num": 35,
          "id": "COMPANHEIRO_I_1",
          "label": "11 anos (Companheiro)",
          "rank": 2
        },
        {
          "num": 1,
          "id": "AMIGO_I_1",
          "label": "10 anos (Amigo)",
          "rank": 1
        }
      ],
      "enabled": true
    },
    {
      "id": "U-02",
      "code": "U-02",
      "title": "Ser Membro Ativo do Clube de Desbravadores",
      "fullTitle": "Ser Membro Ativo do Clube de Desbravadores — *Unificado (6 em 1)*",
      "levelText": "🟢 Nível 1: Equivalência 100% Igual (`AUTO_EQUAL`)",
      "levels": [
        "N1"
      ],
      "ruleCode": "AUTO_EQUAL",
      "scenario": "strict",
      "category": "GERAIS",
      "systemRule": "Baixa automática global: estar ativo no cadastro do Clube valida as 6 classes.",
      "pedagogicalDetails": "Idêntico nas 6 classes: a frequência e membresia ativa no Clube valem para todas simultaneamente.",
      "requirementsCount": 6,
      "requirementIds": [
        "AMIGO_I_2",
        "COMPANHEIRO_I_2",
        "PESQUISADOR_I_2",
        "PIONEIRO_I_2",
        "EXCURSIONISTA_I_2",
        "GUIA_I_2"
      ],
      "requirementNums": [
        2,
        36,
        74,
        108,
        142,
        178
      ],
      "requirements": [
        {
          "num": 2,
          "id": "AMIGO_I_2",
          "code": "I.2",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "I. Gerais (Req. 2)",
          "text": "Ser membro ativo do Clube de Desbravadores."
        },
        {
          "num": 36,
          "id": "COMPANHEIRO_I_2",
          "code": "I.2",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "I. Gerais (Req. 2)",
          "text": "Ser membro ativo do Clube de Desbravadores."
        },
        {
          "num": 74,
          "id": "PESQUISADOR_I_2",
          "code": "I.2",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "I. Gerais (Req. 2)",
          "text": "Ser membro ativo do Clube de Desbravadores."
        },
        {
          "num": 108,
          "id": "PIONEIRO_I_2",
          "code": "I.2",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "I. Gerais (Req. 2)",
          "text": "Ser membro ativo do Clube de Desbravadores."
        },
        {
          "num": 142,
          "id": "EXCURSIONISTA_I_2",
          "code": "I.2",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "I. Gerais (Req. 2)",
          "text": "Ser membro ativo do Clube de Desbravadores."
        },
        {
          "num": 178,
          "id": "GUIA_I_2",
          "code": "I.2",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "I. Gerais (Req. 2)",
          "text": "Ser membro ativo do Clube de Desbravadores."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-03",
      "code": "U-03",
      "title": "Participar Ativamente e Ajudar a Organizar a Classe Bíblica do Clube",
      "fullTitle": "Participar Ativamente e Ajudar a Organizar a Classe Bíblica do Clube — *Unificado (4 em 1)*",
      "levelText": "🟢 Nível 1 + 🔵 Nível 2 (`AUTO_EQUAL` / `HIERARCHICAL_SCALE`)",
      "levels": [
        "N1",
        "N2"
      ],
      "ruleCode": "AUTO_EQUAL",
      "scenario": "strict",
      "category": "GERAIS",
      "systemRule": "Presença na Classe Bíblica valida AM, CO e PE; atuar na equipe organizadora valida PE VI.2.",
      "pedagogicalDetails": "Mesma atividade: participar da Classe Bíblica (Amigo I.6, Companheiro I.6, Pesquisador I.6) ajudando na sua organização (Pesquisador VI.2).",
      "requirementsCount": 4,
      "requirementIds": [
        "AMIGO_I_6",
        "COMPANHEIRO_I_6",
        "PESQUISADOR_I_6",
        "PESQUISADOR_VI_2"
      ],
      "requirementNums": [
        6,
        40,
        78,
        89
      ],
      "requirements": [
        {
          "num": 6,
          "id": "AMIGO_I_6",
          "code": "I.6",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "I. Gerais (Req. 6)",
          "text": "Participar ativamente da Classe Bíblica do seu Clube."
        },
        {
          "num": 40,
          "id": "COMPANHEIRO_I_6",
          "code": "I.6",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "I. Gerais (Req. 6)",
          "text": "Participar ativamente da Classe Bíblica do seu Clube."
        },
        {
          "num": 78,
          "id": "PESQUISADOR_I_6",
          "code": "I.6",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "I. Gerais (Req. 6)",
          "text": "Participar ativamente da Classe Bíblica do seu Clube."
        },
        {
          "num": 89,
          "id": "PESQUISADOR_VI_2",
          "code": "VI.2",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "VI. Organização e Liderança (Req. 2)",
          "text": "Ajudar a organizar a Classe Bíblica do seu Clube."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-04",
      "code": "U-04",
      "title": "Ler o Livro do Curso de Leitura do Ano e Resumir (1 parágrafo → 2 parágrafos → 1 página)",
      "fullTitle": "Ler o Livro do Curso de Leitura do Ano e Resumir (1 parágrafo → 2 parágrafos → 1 página) — *Unificado (6 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "GERAIS",
      "systemRule": "Entregar resumo de 1 página (PI/EX/GU) valida automaticamente 2 parágrafos (PE), 1 parágrafo (CO) e leitura (AM).",
      "pedagogicalDetails": "Escalonado no mesmo livro anual: fazer o resumo de 1 página (Pioneiro/Excursionista/Guia) já engloba 2 parágrafos (Pesquisador), 1 parágrafo (Companheiro) e a leitura simples (Amigo).",
      "requirementsCount": 6,
      "requirementIds": [
        "AMIGO_I_4",
        "COMPANHEIRO_I_4",
        "PESQUISADOR_I_4",
        "PIONEIRO_I_4",
        "EXCURSIONISTA_I_4",
        "GUIA_I_4"
      ],
      "requirementNums": [
        4,
        38,
        76,
        110,
        144,
        180
      ],
      "requirements": [
        {
          "num": 4,
          "id": "AMIGO_I_4",
          "code": "I.4",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "I. Gerais (Req. 4)",
          "text": "Ler o livro do Curso de Leitura do ano."
        },
        {
          "num": 38,
          "id": "COMPANHEIRO_I_4",
          "code": "I.4",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "I. Gerais (Req. 4)",
          "text": "Ler o livro do Curso de Leitura do ano e escrever um parágrafo sobre o que mais lhe chamou atenção ou considerou importante."
        },
        {
          "num": 76,
          "id": "PESQUISADOR_I_4",
          "code": "I.4",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "I. Gerais (Req. 4)",
          "text": "Ler o livro do Curso de Leitura do ano e escrever dois parágrafos sobre o que mais lhe chamou atenção ou considerou importante."
        },
        {
          "num": 110,
          "id": "PIONEIRO_I_4",
          "code": "I.4",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "I. Gerais (Req. 4)",
          "text": "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página."
        },
        {
          "num": 144,
          "id": "EXCURSIONISTA_I_4",
          "code": "I.4",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "I. Gerais (Req. 4)",
          "text": "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página."
        },
        {
          "num": 180,
          "id": "GUIA_I_4",
          "code": "I.4",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "I. Gerais (Req. 4)",
          "text": "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página."
        }
      ],
      "specialties": [],
      "hierarchicalScale": [
        {
          "num": 180,
          "id": "GUIA_I_4",
          "label": "Resumo de 1 página (Guia)",
          "rank": 4
        },
        {
          "num": 144,
          "id": "EXCURSIONISTA_I_4",
          "label": "Resumo de 1 página (Excursionista)",
          "rank": 4
        },
        {
          "num": 110,
          "id": "PIONEIRO_I_4",
          "label": "Resumo de 1 página (Pioneiro)",
          "rank": 4
        },
        {
          "num": 76,
          "id": "PESQUISADOR_I_4",
          "label": "Resumo de 2 parágrafos (Pesquisador)",
          "rank": 3
        },
        {
          "num": 38,
          "id": "COMPANHEIRO_I_4",
          "label": "Resumo de 1 parágrafo (Companheiro)",
          "rank": 2
        },
        {
          "num": 4,
          "id": "AMIGO_I_4",
          "label": "Leitura do livro (Amigo)",
          "rank": 1
        }
      ],
      "enabled": true
    },
    {
      "id": "U-05",
      "code": "U-05",
      "title": "Voto e Lei do Desbravador (Memorizar, Explicar, Ilustrar e Debater/Representar/Redigir)",
      "fullTitle": "Voto e Lei do Desbravador (Memorizar, Explicar, Ilustrar e Debater/Representar/Redigir) — *Unificado (3 em 1)*",
      "levelText": "🟡 Nível 4: Mesma Oficina, Entregas por Nível (`SHARED_EVENT`)",
      "levels": [
        "N4"
      ],
      "ruleCode": "SHARED_EVENT",
      "scenario": "strict",
      "category": "GERAIS",
      "systemRule": "1 única aula de Ideais no calendário; sistema pede check individual (memorizar AM, ilustrar CO, redigir/debater PE).",
      "pedagogicalDetails": "Mesmo objeto: memorizar e explicar Voto e Lei (Amigo I.3), ilustrar criativamente o Voto (Companheiro I.3) e demonstrar compreensão da Lei via representação, debate ou redação (Pesquisador I.3).",
      "requirementsCount": 3,
      "requirementIds": [
        "AMIGO_I_3",
        "COMPANHEIRO_I_3",
        "PESQUISADOR_I_3"
      ],
      "requirementNums": [
        3,
        37,
        75
      ],
      "requirements": [
        {
          "num": 3,
          "id": "AMIGO_I_3",
          "code": "I.3",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "I. Gerais (Req. 3)",
          "text": "Memorizar e explicar o Voto e a Lei do Desbravador."
        },
        {
          "num": 37,
          "id": "COMPANHEIRO_I_3",
          "code": "I.3",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "I. Gerais (Req. 3)",
          "text": "Ilustrar de forma criativa o significado do Voto do Desbravador."
        },
        {
          "num": 75,
          "id": "PESQUISADOR_I_3",
          "code": "I.3",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "I. Gerais (Req. 3)",
          "text": "Demonstrar sua compreensão do significado da Lei do Desbravador através de uma das seguintes atividades: * a) Representação * b) Debate * c) Redação"
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-06",
      "code": "U-06",
      "title": "A Criação (Gn 1-2), Diário de 7 Dias da Criação e História do Dilúvio/Fósseis (EN-017 / AM-EB-006)",
      "fullTitle": "A Criação (Gn 1-2), Diário de 7 Dias da Criação e História do Dilúvio/Fósseis (EN-017 / AM-EB-006) — *Unificado (3 em 1)*",
      "levelText": "🟡 Nível 3/4: Estudo Integrado + Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "Estudo de Gn 1–8 ou conclusão de `EN-017 Fósseis` / `AM-EB-006 Criação` libera os requisitos vinculados.",
      "pedagogicalDetails": "Mesmo tema bíblico-natural (Gênesis 1 a 8): memorizar o que Deus criou em cada dia + 10 pragas/12 tribos/39 livros AT (Amigo II.1), recapitular a Criação fazendo diário de 7 dias (Companheiro VII.3) e estudar o Dilúvio e fossilização (Pioneiro VII.1).",
      "requirementsCount": 3,
      "requirementIds": [
        "AMIGO_II_1",
        "COMPANHEIRO_VII_3",
        "PIONEIRO_VII_1"
      ],
      "requirementNums": [
        7,
        56,
        125
      ],
      "requirements": [
        {
          "num": 7,
          "id": "AMIGO_II_1",
          "code": "II.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "II. Descoberta Espiritual (Req. 1)",
          "text": "Memorizar e demonstrar o seu conhecimento: * a) **Criação:** O que Deus criou em cada dia da Criação. * b) **10 Pragas:** Quais as pragas que caíram sobre o Egito. * c) **12 Tribos:** O nome de cada uma das 12 tribos de Israel. * d) **39 livros do Antigo Testamento** e demonstrar habilidade para encontrar qualquer um deles."
        },
        {
          "num": 56,
          "id": "COMPANHEIRO_VII_3",
          "code": "VII.3",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "VII. Estudo da Natureza (Req. 3)",
          "text": "Recapitular o estudo da Criação e fazer um diário por sete dias registrando suas observações do que foi criado em cada dia correspondente."
        },
        {
          "num": 125,
          "id": "PIONEIRO_VII_1",
          "code": "VII.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "VII. Estudo da Natureza (Req. 1)",
          "text": "Estudar a história do dilúvio e o processo de fossilização."
        }
      ],
      "specialties": [
        "EN-017",
        "AM-EB-006"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-07",
      "code": "U-07",
      "title": "A Lei de Deus / 10 Mandamentos e Princípios de Comportamento Moral (AM-EB-019)",
      "fullTitle": "A Lei de Deus / 10 Mandamentos e Princípios de Comportamento Moral (AM-EB-019) — *Unificado (2 em 1)*",
      "levelText": "🟡 Nível 3/4: Mesmo Texto Bíblico (`SHARED_EVENT`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SHARED_EVENT",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "Estudo de Êxodo 20 (10 Mandamentos) ou `AM-EB-019 Lei de Deus` unifica a aula de CO e a apresentação de EX-AV.",
      "pedagogicalDetails": "Mesmo texto bíblico (Êxodo 20): memorizar os 10 Mandamentos + 27 livros NT (Companheiro II.1) e fazer apresentação sobre o respeito à Lei de Deus e autoridades civis com 10 princípios morais (Excursionista Av. 1).",
      "requirementsCount": 2,
      "requirementIds": [
        "COMPANHEIRO_II_1",
        "EXCURSIONISTA_AVANCADO_AV_1"
      ],
      "requirementNums": [
        41,
        166
      ],
      "requirements": [
        {
          "num": 41,
          "id": "COMPANHEIRO_II_1",
          "code": "II.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "II. Descoberta Espiritual (Req. 1)",
          "text": "Memorizar e demonstrar o seu conhecimento: * a) **10 Mandamentos:** A Lei de Deus dada a Moisés. * b) **27 livros do Novo Testamento** e demonstrar habilidade para encontrar qualquer um deles."
        },
        {
          "num": 166,
          "id": "EXCURSIONISTA_AVANCADO_AV_1",
          "code": "AV.1",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 1)",
          "text": "Fazer uma apresentação escrita ou falada sobre o respeito que devemos ter com a Lei de Deus e as autoridades civis, enumerando 10 princípios de comportamento moral."
        }
      ],
      "specialties": [
        "AM-EB-019"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-08",
      "code": "U-08",
      "title": "O Sermão da Montanha, Bem-Aventuranças (Mateus 5-7) e Livro 'O Maior Discurso de Cristo'",
      "fullTitle": "O Sermão da Montanha, Bem-Aventuranças (Mateus 5-7) e Livro 'O Maior Discurso de Cristo' — *Unificado (3 em 1)*",
      "levelText": "🔵 Nível 2 + 🟡 Nível 3: Mesmo Texto (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "Estudo de Mateus 5–7 (Sermão do Monte) + leitura de *O Maior Discurso de Cristo*.",
      "pedagogicalDetails": "Mesmo texto bíblico (Mateus 5 a 7): escolher 'O Sermão da Montanha' em Companheiro (II.4c), memorizar/explicar as Bem-Aventuranças do Sermão da Montanha em Pioneiro (II.1a) e ler o livro 'O Maior Discurso de Cristo' (comentário do Sermão da Montanha) com resumo de 1 página em Guia Avançado (Req. 2).",
      "requirementsCount": 3,
      "requirementIds": [
        "COMPANHEIRO_II_4",
        "PIONEIRO_II_1",
        "GUIA_AVANCADO_AV_2"
      ],
      "requirementNums": [
        44,
        112,
        204
      ],
      "requirements": [
        {
          "num": 44,
          "id": "COMPANHEIRO_II_4",
          "code": "II.4",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "II. Descoberta Espiritual (Req. 4)",
          "text": "Em consulta com o seu conselheiro, escolher um dos seguintes temas: * a) Uma parábola de Jesus * b) Um milagre de Jesus * c) O Sermão da Montanha * d) Um sermão sobre a Segunda Vinda de Cristo *Escolher um item abaixo para demonstrar seu conhecimento sobre o tema escolhido:* * a) Troca de ideias com o seu conselheiro * b) Atividade que integre todo o grupo * c) Redação"
        },
        {
          "num": 112,
          "id": "PIONEIRO_II_1",
          "code": "II.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "II. Descoberta Espiritual (Req. 1)",
          "text": "Memorizar e demonstrar o seu conhecimento: * a) **Bem-Aventuranças:** o sermão da montanha."
        },
        {
          "num": 204,
          "id": "GUIA_AVANCADO_AV_2",
          "code": "AV.2",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 2)",
          "text": "Ler o livro *O maior discurso de Cristo* e escrever uma página sobre o efeito da leitura em sua vida."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-09",
      "code": "U-09",
      "title": "História de Nicodemos (João 3) e Metamorfose da Lagarta/Borboleta (EN-008)",
      "fullTitle": "História de Nicodemos (João 3) e Metamorfose da Lagarta/Borboleta (EN-008) — *Unificado (2 em 1)*",
      "levelText": "🟢 Nível 1 / 🟡 Nível 3: Mesmo Texto (`AUTO_EQUAL` / `SPECIALTY_ABSORPTION`)",
      "levels": [
        "N1",
        "N3"
      ],
      "ruleCode": "AUTO_EQUAL",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "Ao escolher 'João 3 – Nicodemos' em PE II.4a ou concluir `EN-008 Mariposas e Borboletas`, unifica com EX VII.1.",
      "pedagogicalDetails": "Mesma passagem bíblica (João 3): escolher a história de 'João 3 – Nicodemos' sobre como Jesus salva (Pesquisador II.4a) e recapitular a história de Nicodemos relacionando-a ao ciclo da lagarta/borboleta (Excursionista VII.1).",
      "requirementsCount": 2,
      "requirementIds": [
        "PESQUISADOR_II_4",
        "EXCURSIONISTA_VII_1"
      ],
      "requirementNums": [
        82,
        161
      ],
      "requirements": [
        {
          "num": 82,
          "id": "PESQUISADOR_II_4",
          "code": "II.4",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "II. Descoberta Espiritual (Req. 4)",
          "text": "Conversar com seu líder e escolher uma das seguintes histórias: * a) João 3 – Nicodemos * b) João 4 – A mulher samaritana * c) Lucas 10 – O bom samaritano * d) Lucas 15 – O filho pródigo * e) Lucas 19 – Zaqueu *Através da história escolhida, demonstrar sua compreensão em como Jesus salva as pessoas, usando um dos métodos abaixo:* * a) Conversar em grupo com a participação de seu líder * b) Apresentar uma mensagem em uma reunião do Clube * c) Fazer uma série de cartazes ou uma maquete * d) Escrever uma poesia ou hino"
        },
        {
          "num": 161,
          "id": "EXCURSIONISTA_VII_1",
          "code": "VII.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "VII. Estudo da Natureza (Req. 1)",
          "text": "Recapitular a história de Nicodemos e relacioná-la com o ciclo de vida da lagarta ou borboleta, acrescentando um significado espiritual."
        }
      ],
      "specialties": [
        "EN-008"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-10",
      "code": "U-10",
      "title": "O Espírito Santo e o Fruto do Espírito no Crescimento Cristão (AM-EB-005)",
      "fullTitle": "O Espírito Santo e o Fruto do Espírito no Crescimento Cristão (AM-EB-005) — *Unificado (2 em 1)*",
      "levelText": "🟡 Nível 3/4: Estudo Doutrinário Único (`SHARED_EVENT`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SHARED_EVENT",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "1 aula sobre Espírito Santo e Fruto do Espírito (ou especialidade `AM-EB-005`) atende ambos os itens de EX.",
      "pedagogicalDetails": "Mesmo tema doutrinário (intra-classe Excursionista): memorizar o Fruto do Espírito + 12 Apóstolos (Excursionista II.1) e estudar a pessoa e o papel do Espírito Santo no crescimento espiritual (Excursionista II.3).",
      "requirementsCount": 2,
      "requirementIds": [
        "EXCURSIONISTA_II_1",
        "EXCURSIONISTA_II_3"
      ],
      "requirementNums": [
        146,
        148
      ],
      "requirements": [
        {
          "num": 146,
          "id": "EXCURSIONISTA_II_1",
          "code": "II.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "II. Descoberta Espiritual (Req. 1)",
          "text": "Memorizar e demonstrar o seu conhecimento: * a) **Apóstolos:** O nome dos 12 apóstolos de Cristo. * b) **Fruto do Espírito:** A relação de adjetivos do caráter do cristão."
        },
        {
          "num": 148,
          "id": "EXCURSIONISTA_II_3",
          "code": "II.3",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "II. Descoberta Espiritual (Req. 3)",
          "text": "Estudar e entender a pessoa do Espírito Santo, como Ele se relaciona, e qual o Seu papel no crescimento espiritual de cada ser humano."
        }
      ],
      "specialties": [
        "AM-EB-005"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-11",
      "code": "U-11",
      "title": "Eventos Finais, Segunda Vinda de Cristo e As 3 Mensagens Angélicas / 7 Igrejas / Nova Jerusalém (Apocalipse - AM-052 / AM-EB-025)",
      "fullTitle": "Eventos Finais, Segunda Vinda de Cristo e As 3 Mensagens Angélicas / 7 Igrejas / Nova Jerusalém (Apocalipse - AM-052 / AM-EB-025) — *Unificado (2 em 1)*",
      "levelText": "🟡 Nível 3/4: Estudo Escatológico Único (`SHARED_EVENT`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SHARED_EVENT",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "1 estudo sobre Segunda Vinda e Apocalipse (ou `AM-052` / `AM-EB-025`) atende EX II.4 e GU II.1.",
      "pedagogicalDetails": "Mesmo tema escatológico: estudar em Unidade os eventos finais e a Segunda Vinda de Cristo (Excursionista II.4) junto às 3 Mensagens Angélicas (Ap 14:6-12), 7 Igrejas e 12 fundamentos da Nova Jerusalém (Guia II.1).",
      "requirementsCount": 2,
      "requirementIds": [
        "EXCURSIONISTA_II_4",
        "GUIA_II_1"
      ],
      "requirementNums": [
        149,
        182
      ],
      "requirements": [
        {
          "num": 149,
          "id": "EXCURSIONISTA_II_4",
          "code": "II.4",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "II. Descoberta Espiritual (Req. 4)",
          "text": "Estudar, com sua Unidade, os eventos finais e a segunda vinda de Cristo."
        },
        {
          "num": 182,
          "id": "GUIA_II_1",
          "code": "II.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "II. Descoberta Espiritual (Req. 1)",
          "text": "Memorizar e demonstrar o seu conhecimento: * a) **3 Mensagens Angélicas:** Reveladas em Apocalipse 14:6-12. * b) **7 Igrejas:** O nome das igrejas do Apocalipse. * c) **Pedras preciosas:** Os 12 fundamentos da Cidade Santa – A Nova Jerusalém."
        }
      ],
      "specialties": [
        "AM-052",
        "AM-EB-025"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-12",
      "code": "U-12",
      "title": "Histórias de Pioneiros Adventistas (J. N. Andrews e Pioneiros Nacionais - AM-043)",
      "fullTitle": "Histórias de Pioneiros Adventistas (J. N. Andrews e Pioneiros Nacionais - AM-043) — *Unificado (2 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "Apresentar 3 histórias de pioneiros (GU II.5, incluindo J. N. Andrews) já cumpre automaticamente PE-AV 2 (1 história).",
      "pedagogicalDetails": "Escalonado no mesmo tema: ler e resumir 3 histórias de pioneiros adventistas e contá-las no Clube (Guia II.5), incluindo J. N. Andrews e um pioneiro do país para discutir a comissão missionária de Mt 28:18-20 (Pesquisador Av. 2).",
      "requirementsCount": 2,
      "requirementIds": [
        "PESQUISADOR_AVANCADO_AV_2",
        "GUIA_II_5"
      ],
      "requirementNums": [
        97,
        186
      ],
      "requirements": [
        {
          "num": 97,
          "id": "PESQUISADOR_AVANCADO_AV_2",
          "code": "AV.2",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 2)",
          "text": "Ler a história de J. N. Andrews ou de um pioneiro do seu país e discutir a importância do trabalho missionário e por que Cristo ordenou a grande comissão (Mateus 28:18-20)."
        },
        {
          "num": 186,
          "id": "GUIA_II_5",
          "code": "II.5",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "II. Descoberta Espiritual (Req. 5)",
          "text": "Ler e resumir três histórias de pioneiros adventistas. Contar essas histórias na reunião do Clube, no culto JA ou na Escola Sabatina."
        }
      ],
      "specialties": [],
      "hierarchicalScale": [
        {
          "num": 186,
          "id": "GUIA_II_5",
          "label": "Resumir e contar 3 histórias de pioneiros (Guia)",
          "rank": 2
        },
        {
          "num": 97,
          "id": "PESQUISADOR_AVANCADO_AV_2",
          "label": "História de J. N. Andrews ou pioneiro nacional (Pesquisador Av.)",
          "rank": 1
        }
      ],
      "enabled": true
    },
    {
      "id": "U-13",
      "code": "U-13",
      "title": "Leitura de 'Primeiros Escritos' de Ellen White (Primeira Visão págs. 13-20 e Visão de Órion pág. 41)",
      "fullTitle": "Leitura de 'Primeiros Escritos' de Ellen White (Primeira Visão págs. 13-20 e Visão de Órion pág. 41) — *Unificado (2 em 1)*",
      "levelText": "🟡 Nível 4: Mesmo Livro-Fonte (`SHARED_EVENT`)",
      "levels": [
        "N4"
      ],
      "ruleCode": "SHARED_EVENT",
      "scenario": "strict",
      "category": "ESPIRITUAL",
      "systemRule": "1 encontro de leitura de *Primeiros Escritos* (págs. 13–20 e pág. 41) + observação de Órion.",
      "pedagogicalDetails": "Mesmo livro fonte: ler e discutir a primeira visão de Ellen White em 'Primeiros Escritos' págs. 13-20 (Companheiro Av. 2) e o significado espiritual de Órion em 'Primeiros Escritos' pág. 41 com identificação de Órion e Alfa Centauri (Pesquisador VII.1).",
      "requirementsCount": 2,
      "requirementIds": [
        "COMPANHEIRO_AVANCADO_AV_2",
        "PESQUISADOR_VII_1"
      ],
      "requirementNums": [
        62,
        90
      ],
      "requirements": [
        {
          "num": 62,
          "id": "COMPANHEIRO_AVANCADO_AV_2",
          "code": "AV.2",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 2)",
          "text": "Ler a primeira visão de Ellen White e discutir como Deus usa os profetas para apresentar Sua mensagem à igreja (*Primeiros Escritos*, págs. 13 a 20)."
        },
        {
          "num": 90,
          "id": "PESQUISADOR_VII_1",
          "code": "VII.1",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "VII. Estudo da Natureza (Req. 1)",
          "text": "Identificar a estrela Alfa da constelação de Centauro e a constelação de Órion. Conhecer o significado espiritual de Órion, como descrito no livro *Primeiros Escritos*, pág. 41."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-14",
      "code": "U-14",
      "title": "Estudo sobre a Observância do Sábado e Prática de 5 Atividades/Jogos na Natureza no Sábado à Tarde (AM-EB-020)",
      "fullTitle": "Estudo sobre a Observância do Sábado e Prática de 5 Atividades/Jogos na Natureza no Sábado à Tarde (AM-EB-020) — *Unificado (4 em 1)*",
      "levelText": "🔵 Nível 2 + 🟡 Nível 3: Prática de Sábado (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "SERVICO",
      "systemRule": "Estudo bíblico do sábado + realizar 5 atividades na natureza no sábado à tarde (EX-AV 4) já engloba 1h de jogos na natureza (CO VII.1).",
      "pedagogicalDetails": "Mesmo tema e prática: estudar na Bíblia e conversar em Unidade sobre o significado da observância do sábado (Excursionista II.5 e Excursionista Av. 6d) e realizar 1h de jogos/caminhada na natureza (Companheiro VII.1) aplicando as 5 atividades na natureza para o sábado à tarde (Excursionista Av. 4).",
      "requirementsCount": 4,
      "requirementIds": [
        "COMPANHEIRO_VII_1",
        "EXCURSIONISTA_II_5",
        "EXCURSIONISTA_AVANCADO_AV_4",
        "EXCURSIONISTA_AVANCADO_AV_6"
      ],
      "requirementNums": [
        54,
        150,
        169,
        171
      ],
      "requirements": [
        {
          "num": 54,
          "id": "COMPANHEIRO_VII_1",
          "code": "VII.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "VII. Estudo da Natureza (Req. 1)",
          "text": "Participar de jogos na natureza ou caminhada ecológica, pelo período de uma hora."
        },
        {
          "num": 150,
          "id": "EXCURSIONISTA_II_5",
          "code": "II.5",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "II. Descoberta Espiritual (Req. 5)",
          "text": "Através do estudo da Bíblia, descobrir o verdadeiro significado da observância do sábado."
        },
        {
          "num": 169,
          "id": "EXCURSIONISTA_AVANCADO_AV_4",
          "code": "AV.4",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 4)",
          "text": "Apresentar cinco atividades na natureza, para serem realizadas no sábado à tarde."
        },
        {
          "num": 171,
          "id": "EXCURSIONISTA_AVANCADO_AV_6",
          "code": "AV.6",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 6)",
          "text": "Através da supervisão de seu líder ou conselheiro, conversar em sua Unidade ou Clube sobre um dos seguintes temas: * a) Modéstia cristã * b) Recreação * c) Saúde * d) Observância do sábado"
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-15",
      "code": "U-15",
      "title": "Convidar Amigos/Visitantes para Classe Bíblica, Pequeno Grupo, Escola Sabatina ou Clube + Palestra sobre Influenciar Amigos",
      "fullTitle": "Convidar Amigos/Visitantes para Classe Bíblica, Pequeno Grupo, Escola Sabatina ou Clube + Palestra sobre Influenciar Amigos — *Unificado (6 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "SERVICO",
      "systemRule": "Convidar >= 3 amigos não adventistas para Classe Bíblica/Clube e 2 reuniões da igreja dá baixa automática em PI, AM-AV, PE-AV, EX e GU-AV.",
      "pedagogicalDetails": "Mesma ação evangelística escalonada: preparar 1 página/palestra sobre como influenciar amigos para Cristo (Guia Av. 4) e levar 3 amigos não adventistas para a Classe Bíblica/Clube/Escola Sabatina/reuniões e atividade social da igreja cumpre Amigo Av. 3 (2 amigos), Pesquisador Av. 3 (1 pessoa), Pioneiro II.5 (3+ pessoas), Excursionista III.1 (1 amigo) e Guia Av. 3a (2 amigos em 2 reuniões).",
      "requirementsCount": 6,
      "requirementIds": [
        "AMIGO_AVANCADO_AV_3",
        "PESQUISADOR_AVANCADO_AV_3",
        "PIONEIRO_II_5",
        "EXCURSIONISTA_III_1",
        "GUIA_AVANCADO_AV_3",
        "GUIA_AVANCADO_AV_4"
      ],
      "requirementNums": [
        28,
        98,
        116,
        152,
        205,
        206
      ],
      "requirements": [
        {
          "num": 28,
          "id": "AMIGO_AVANCADO_AV_3",
          "code": "AV.3",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 3)",
          "text": "Levar pelo menos dois amigos não adventistas à Escola Sabatina ou ao Clube de Desbravadores."
        },
        {
          "num": 98,
          "id": "PESQUISADOR_AVANCADO_AV_3",
          "code": "AV.3",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 3)",
          "text": "Convidar uma pessoa para assistir um dos seguintes programas: * a) Clube de Desbravadores * b) Classe Bíblica * c) Pequeno Grupo"
        },
        {
          "num": 116,
          "id": "PIONEIRO_II_5",
          "code": "II.5",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "II. Descoberta Espiritual (Req. 5)",
          "text": "Convidar três ou mais pessoas para assistirem a uma Classe Bíblica ou Pequeno Grupo."
        },
        {
          "num": 152,
          "id": "EXCURSIONISTA_III_1",
          "code": "III.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "III. Servindo a Outros (Req. 1)",
          "text": "Convidar um amigo para participar de uma atividade social de sua igreja ou da Associação/Missão."
        },
        {
          "num": 205,
          "id": "GUIA_AVANCADO_AV_3",
          "code": "AV.3",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 3)",
          "text": "Cumprir um dos seguintes itens: * a) Trazer dois amigos para assistir a duas diferentes reuniões da igreja * b) Ajudar a planejar e participar de, no mínimo, quatro domingos em uma série de evangelismo jovem"
        },
        {
          "num": 206,
          "id": "GUIA_AVANCADO_AV_4",
          "code": "AV.4",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 4)",
          "text": "Escrever uma página ou apresentar uma palestra sobre como influenciar amigos para Cristo."
        }
      ],
      "specialties": [],
      "hierarchicalScale": [
        {
          "num": 206,
          "id": "GUIA_AVANCADO_AV_4",
          "label": "Escrever 1 pág/palestra de como influenciar amigos (Guia Av.)",
          "rank": 3
        },
        {
          "num": 205,
          "id": "GUIA_AVANCADO_AV_3",
          "label": "Trazer 2 amigos para 2 reuniões da igreja (Guia Av.)",
          "rank": 3
        },
        {
          "num": 116,
          "id": "PIONEIRO_II_5",
          "label": "Convidar 3 ou mais pessoas para Classe Bíblica/PG (Pioneiro)",
          "rank": 3
        },
        {
          "num": 28,
          "id": "AMIGO_AVANCADO_AV_3",
          "label": "Levar 2 amigos não adventistas à ES ou Clube (Amigo Av.)",
          "rank": 2
        },
        {
          "num": 152,
          "id": "EXCURSIONISTA_III_1",
          "label": "Convidar 1 amigo para atividade social (Excursionista)",
          "rank": 1
        },
        {
          "num": 98,
          "id": "PESQUISADOR_AVANCADO_AV_3",
          "label": "Convidar 1 pessoa para Clube/Classe Bíblica/PG (Pesquisador Av.)",
          "rank": 1
        }
      ],
      "enabled": true
    },
    {
      "id": "U-16",
      "code": "U-16",
      "title": "Projeto Comunitário e Humanitário Prático (2h de Serviço / Bom Samaritano / Auxílio a Carentes e Doentes)",
      "fullTitle": "Projeto Comunitário e Humanitário Prático (2h de Serviço / Bom Samaritano / Auxílio a Carentes e Doentes) — *Unificado (9 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "SERVICO",
      "systemRule": "1 Projeto Comunitário planejado/executado (>= 2h, com amigo, ajudando >= 3 pessoas/famílias) dá baixa nos 9 requisitos comunitários.",
      "pedagogicalDetails": "Mesma ação comunitária escalonada: planejar, organizar e executar um projeto comunitário de pelo menos 2 horas envolvendo um amigo, visitando/ajudando na prática 3 ou mais pessoas/famílias em necessidade e encenando o Bom Samaritano cumpre: Amigo III.1, Companheiro III.1, Companheiro III.2, Companheiro Av. 3, Pesquisador III.1, Pioneiro III.2, Pioneiro Av. 2, Excursionista III.2 e Guia III.1.",
      "requirementsCount": 9,
      "requirementIds": [
        "AMIGO_III_1",
        "COMPANHEIRO_III_1",
        "COMPANHEIRO_III_2",
        "COMPANHEIRO_AVANCADO_AV_3",
        "PESQUISADOR_III_1",
        "PIONEIRO_III_2",
        "PIONEIRO_AVANCADO_AV_2",
        "EXCURSIONISTA_III_2",
        "GUIA_III_1"
      ],
      "requirementNums": [
        10,
        45,
        46,
        63,
        83,
        119,
        132,
        153,
        188
      ],
      "requirements": [
        {
          "num": 10,
          "id": "AMIGO_III_1",
          "code": "III.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "III. Servindo a Outros (Req. 1)",
          "text": "Dedicar duas horas ajudando alguém em sua comunidade, através de duas das seguintes atividades: * a) Visitar alguém que precisa de amizade e orar com essa pessoa. * b) Oferecer alimento a alguém carente. * c) Participar de um projeto ecológico ou educativo."
        },
        {
          "num": 45,
          "id": "COMPANHEIRO_III_1",
          "code": "III.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "III. Servindo a Outros (Req. 1)",
          "text": "Planejar e dedicar pelo menos duas horas servindo sua comunidade e demonstrando companheirismo a alguém, de maneira prática."
        },
        {
          "num": 46,
          "id": "COMPANHEIRO_III_2",
          "code": "III.2",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "III. Servindo a Outros (Req. 2)",
          "text": "Participar de um projeto que beneficiará sua comunidade ou igreja."
        },
        {
          "num": 63,
          "id": "COMPANHEIRO_AVANCADO_AV_3",
          "code": "AV.3",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 3)",
          "text": "Participar de uma atividade missionária ou comunitária, envolvendo também um amigo."
        },
        {
          "num": 83,
          "id": "PESQUISADOR_III_1",
          "code": "III.1",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "III. Servindo a Outros (Req. 1)",
          "text": "Conhecer os projetos comunitários desenvolvidos em sua cidade e participar de, pelo menos, um deles com sua Unidade ou Clube."
        },
        {
          "num": 119,
          "id": "PIONEIRO_III_2",
          "code": "III.2",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "III. Servindo a Outros (Req. 2)",
          "text": "Trabalhar em um projeto comunitário de sua igreja, escola ou comunidade."
        },
        {
          "num": 132,
          "id": "PIONEIRO_AVANCADO_AV_2",
          "code": "AV.2",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 2)",
          "text": "Encenar a história do bom samaritano, demonstrando como ajudar as pessoas e auxiliar de forma prática três pessoas ou mais."
        },
        {
          "num": 153,
          "id": "EXCURSIONISTA_III_2",
          "code": "III.2",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "III. Servindo a Outros (Req. 2)",
          "text": "Participar de um projeto comunitário desde o planejamento, organização até a execução."
        },
        {
          "num": 188,
          "id": "GUIA_III_1",
          "code": "III.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "III. Servindo a Outros (Req. 1)",
          "text": "Ajudar a organizar e participar de uma das seguintes atividades: * a) Fazer uma visita de cortesia a uma pessoa doente * b) Adotar uma pessoa ou família em necessidade e ajudá-los * c) Um projeto de sua escolha aprovado por seu líder"
        }
      ],
      "specialties": [],
      "hierarchicalScale": [
        {
          "num": 153,
          "id": "EXCURSIONISTA_III_2",
          "label": "Projeto comunitário do planejamento à execução (Excursionista)",
          "rank": 3
        },
        {
          "num": 132,
          "id": "PIONEIRO_AVANCADO_AV_2",
          "label": "Bom Samaritano e auxílio prático a 3+ pessoas (Pioneiro Av.)",
          "rank": 3
        },
        {
          "num": 188,
          "id": "GUIA_III_1",
          "label": "Organizar visita a doente ou adotar família carente (Guia)",
          "rank": 2
        },
        {
          "num": 45,
          "id": "COMPANHEIRO_III_1",
          "label": "Planejar e dedicar 2h servindo a comunidade (Companheiro)",
          "rank": 2
        },
        {
          "num": 10,
          "id": "AMIGO_III_1",
          "label": "Dedicar 2h ajudando alguém (visita, alimento, ecológico) (Amigo)",
          "rank": 2
        },
        {
          "num": 63,
          "id": "COMPANHEIRO_AVANCADO_AV_3",
          "label": "Atividade missionária/comunitária com um amigo (Companheiro Av.)",
          "rank": 2
        },
        {
          "num": 83,
          "id": "PESQUISADOR_III_1",
          "label": "Conhecer projetos comunitários e participar de um (Pesquisador)",
          "rank": 1
        },
        {
          "num": 119,
          "id": "PIONEIRO_III_2",
          "label": "Trabalhar em projeto comunitário da igreja/escola (Pioneiro)",
          "rank": 1
        },
        {
          "num": 46,
          "id": "COMPANHEIRO_III_2",
          "label": "Participar de projeto que beneficiará comunidade (Companheiro)",
          "rank": 1
        }
      ],
      "enabled": true
    },
    {
      "id": "U-17",
      "code": "U-17",
      "title": "Treinamento de Evangelismo Pessoal, Visita Pastoral, 3 Atividades Missionárias e Especialidades Aventuras com Cristo (AM-016) e Testemunho Juvenil (AM-010)",
      "fullTitle": "Treinamento de Evangelismo Pessoal, Visita Pastoral, 3 Atividades Missionárias e Especialidades Aventuras com Cristo (AM-016) e Testemunho Juvenil (AM-010) — *Unificado (7 em 1)*",
      "levelText": "🟣 Nível 3: Absorção por Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "SERVICO",
      "systemRule": "Concluir `AM-016 Aventuras com Cristo` e `AM-010 Testemunho Juvenil` (com visita pastoral e 3 ações missionárias) dá baixa nos 7 requisitos.",
      "pedagogicalDetails": "Especialidade contém o requisito: realizar o seminário de Ministério Pessoal/Evangelismo (Pioneiro VI.1 e Guia III.2), acompanhar o pastor/ancião numa visita missionária ou estudo bíblico (Excursionista Av. 2) e atuar em 3 atividades/projetos missionários (Pesquisador III.2 = 3; Pioneiro III.1 = 2) cumpre simultaneamente os requisitos internos das especialidades obrigatórias Aventuras com Cristo (Excursionista VI.3) e Testemunho Juvenil (Excursionista Av. 3).",
      "requirementsCount": 7,
      "requirementIds": [
        "PESQUISADOR_III_2",
        "PIONEIRO_III_1",
        "PIONEIRO_VI_1",
        "EXCURSIONISTA_VI_3",
        "EXCURSIONISTA_AVANCADO_AV_2",
        "EXCURSIONISTA_AVANCADO_AV_3",
        "GUIA_III_2"
      ],
      "requirementNums": [
        84,
        118,
        123,
        160,
        167,
        168,
        189
      ],
      "requirements": [
        {
          "num": 84,
          "id": "PESQUISADOR_III_2",
          "code": "III.2",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "III. Servindo a Outros (Req. 2)",
          "text": "Participar em três atividades missionárias da igreja."
        },
        {
          "num": 118,
          "id": "PIONEIRO_III_1",
          "code": "III.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "III. Servindo a Outros (Req. 1)",
          "text": "Participar em dois projetos missionários definidos por seu Clube."
        },
        {
          "num": 123,
          "id": "PIONEIRO_VI_1",
          "code": "VI.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "VI. Organização e Liderança (Req. 1)",
          "text": "Assistir a um seminário ou treinamento oferecido pela sua igreja ou distrito nos departamentos abaixo: * a) Ministério Pessoal * b) Evangelismo"
        },
        {
          "num": 160,
          "id": "EXCURSIONISTA_VI_3",
          "code": "VI.3",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "VI. Organização e Liderança (Req. 3)",
          "text": "Completar a especialidade de Aventuras com Cristo."
        },
        {
          "num": 167,
          "id": "EXCURSIONISTA_AVANCADO_AV_2",
          "code": "AV.2",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 2)",
          "text": "Acompanhar seu pastor ou ancião numa visita missionária ou estudo bíblico."
        },
        {
          "num": 168,
          "id": "EXCURSIONISTA_AVANCADO_AV_3",
          "code": "AV.3",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 3)",
          "text": "Completar a especialidade de Testemunho juvenil."
        },
        {
          "num": 189,
          "id": "GUIA_III_2",
          "code": "III.2",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "III. Servindo a Outros (Req. 2)",
          "text": "Discutir com sua Unidade os métodos de evangelismo pessoal e colocar alguns princípios em prática."
        }
      ],
      "specialties": [
        "AM-016",
        "AM-010"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-18",
      "code": "U-18",
      "title": "Visita a Órgão Público e Organização de Atividade Recreativa para Pessoas com Necessidades Específicas",
      "fullTitle": "Visita a Órgão Público e Organização de Atividade Recreativa para Pessoas com Necessidades Específicas — *Unificado (2 em 1)*",
      "levelText": "🟡 Nível 4: Saída Cívico-Comunitária Única (`SHARED_EVENT`)",
      "levels": [
        "N4"
      ],
      "ruleCode": "SHARED_EVENT",
      "scenario": "strict",
      "category": "SERVICO",
      "systemRule": "1 visita a órgão/instituição pública (PE IV.2) organizando ali 1 atividade recreativa inclusiva (EX IV.2).",
      "pedagogicalDetails": "Ação cívico-inclusiva conjunta: visitar um órgão/instituição pública do bairro/cidade para descobrir como o Clube pode ajudar (Pesquisador IV.2) e organizar uma das 5 atividades recreativas para pessoas com necessidades específicas atendidas (Excursionista IV.2).",
      "requirementsCount": 2,
      "requirementIds": [
        "PESQUISADOR_IV_2",
        "EXCURSIONISTA_IV_2"
      ],
      "requirementNums": [
        86,
        156
      ],
      "requirements": [
        {
          "num": 86,
          "id": "PESQUISADOR_IV_2",
          "code": "IV.2",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "IV. Desenvolvendo Amizade (Req. 2)",
          "text": "Visitar um órgão público de sua cidade ou bairro e descobrir de que maneiras o Clube pode ser útil à sua comunidade."
        },
        {
          "num": 156,
          "id": "EXCURSIONISTA_IV_2",
          "code": "IV.2",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "IV. Desenvolvendo Amizade (Req. 2)",
          "text": "Preparar uma lista contendo cinco sugestões de atividades recreativas para ajudar pessoas com necessidades específicas e colaborar na organização de uma dessas atividades para essas pessoas."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-19",
      "code": "U-19",
      "title": "Cidadania, Boas Maneiras, Regra Áurea, Diversidade e Especialidades de Asseio e Cortesia Cristã (AM-011) e Cidadania Cristã (AM-006)",
      "fullTitle": "Cidadania, Boas Maneiras, Regra Áurea, Diversidade e Especialidades de Asseio e Cortesia Cristã (AM-011) e Cidadania Cristã (AM-006) — *Unificado (7 em 1)*",
      "levelText": "🟣 Nível 3: Absorção por Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "RELACIONAMENTOS",
      "systemRule": "Concluir `AM-011 Asseio e Cortesia Cristã` e `AM-006 Cidadania Cristã` cumpre os 7 requisitos de cidadania, boas maneiras e convivência.",
      "pedagogicalDetails": "Especialidade contém o requisito: as especialidades Asseio e Cortesia Cristã (Pesquisador Av. 4a) e Cidadania Cristã (Pioneiro Av. 1) exigem: explicar como ser um bom cidadão no lar e na escola (Amigo III.2), praticar a Regra Áurea de Mt 7:12 e qualidades de um amigo (Amigo IV.1), demonstrar boas maneiras à mesa e com diferentes idades (Amigo Av. 4), respeitar diferentes culturas, raça e sexo (Companheiro IV.1) e relacionar-se como jovem adventista com vizinhos, escola e sociedade (Excursionista III.3).",
      "requirementsCount": 7,
      "requirementIds": [
        "AMIGO_III_2",
        "AMIGO_IV_1",
        "AMIGO_AVANCADO_AV_4",
        "COMPANHEIRO_IV_1",
        "PESQUISADOR_AVANCADO_AV_4",
        "PIONEIRO_AVANCADO_AV_1",
        "EXCURSIONISTA_III_3"
      ],
      "requirementNums": [
        11,
        12,
        29,
        47,
        99,
        131,
        154
      ],
      "requirements": [
        {
          "num": 11,
          "id": "AMIGO_III_2",
          "code": "III.2",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "III. Servindo a Outros (Req. 2)",
          "text": "Escrever uma redação explicando como ser um bom cidadão no lar e na escola."
        },
        {
          "num": 12,
          "id": "AMIGO_IV_1",
          "code": "IV.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "IV. Desenvolvendo Amizade (Req. 1)",
          "text": "Mencionar dez qualidades de um bom amigo e apresentar quatro situações diárias onde você praticou a Regra Áurea de Mateus 7:12."
        },
        {
          "num": 29,
          "id": "AMIGO_AVANCADO_AV_4",
          "code": "AV.4",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 4)",
          "text": "Conhecer os princípios de higiene, de boas maneiras à mesa e como se comportar diante de pessoas que tenham diferentes idades. Demonstrar e explicar como estas boas maneiras podem ser úteis nas reuniões e acampamentos do Clube."
        },
        {
          "num": 47,
          "id": "COMPANHEIRO_IV_1",
          "code": "IV.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "IV. Desenvolvendo Amizade (Req. 1)",
          "text": "Conversar com seu Conselheiro ou Unidade sobre como respeitar pessoas de diferentes culturas, raça e sexo."
        },
        {
          "num": 99,
          "id": "PESQUISADOR_AVANCADO_AV_4",
          "code": "AV.4",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 4)",
          "text": "Fazer uma das seguintes especialidades: * a) Asseio e cortesia cristã * b) Vida familiar"
        },
        {
          "num": 131,
          "id": "PIONEIRO_AVANCADO_AV_1",
          "code": "AV.1",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 1)",
          "text": "Completar a especialidade de Cidadania cristã, caso não tenha sido realizada anteriormente."
        },
        {
          "num": 154,
          "id": "EXCURSIONISTA_III_3",
          "code": "III.3",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "III. Servindo a Outros (Req. 3)",
          "text": "Discutir como os jovens adventistas devem se relacionar com as pessoas nas diferentes situações do dia a dia, tais como: * a) Vizinhos * b) Escola * c) Atividades sociais * d) Atividades recreativas"
        }
      ],
      "specialties": [
        "AM-011",
        "AM-006"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-20",
      "code": "U-20",
      "title": "Hinos (Nacional e Desbravadores), Bandeiras (Nacional, DBV e Bandeirim) e Especialidade de Ordem Unida (AR-047)",
      "fullTitle": "Hinos (Nacional e Desbravadores), Bandeiras (Nacional, DBV e Bandeirim) e Especialidade de Ordem Unida (AR-047) — *Unificado (5 em 1)*",
      "levelText": "🟣 Nível 3: Absorção por Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "RELACIONAMENTOS",
      "systemRule": "Concluir `AR-047 Ordem Unida` (com Hinos e Bandeiras Nacional/DBV) dá baixa nos 5 requisitos de civismo.",
      "pedagogicalDetails": "Especialidade contém o requisito: a especialidade de Ordem Unida (AR-047, obrigatória em Excursionista Av. 10) engloba o civismo e uso de símbolos: Hino Nacional (Amigo IV.2), Hino dos Desbravadores (Amigo Av. 1), Bandeira Nacional (Companheiro Av. 1) e Bandeira dos Desbravadores/Bandeirim de Unidade (Pesquisador Av. 1).",
      "requirementsCount": 5,
      "requirementIds": [
        "AMIGO_IV_2",
        "AMIGO_AVANCADO_AV_1",
        "COMPANHEIRO_AVANCADO_AV_1",
        "PESQUISADOR_AVANCADO_AV_1",
        "EXCURSIONISTA_AVANCADO_AV_10"
      ],
      "requirementNums": [
        13,
        26,
        61,
        96,
        175
      ],
      "requirements": [
        {
          "num": 13,
          "id": "AMIGO_IV_2",
          "code": "IV.2",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "IV. Desenvolvendo Amizade (Req. 2)",
          "text": "Saber cantar o Hino Nacional de seu país e conhecer sua história. Saber o nome do autor da letra e da música do hino."
        },
        {
          "num": 26,
          "id": "AMIGO_AVANCADO_AV_1",
          "code": "AV.1",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 1)",
          "text": "Memorizar, cantar ou tocar o Hino dos Desbravadores e conhecer a história do hino."
        },
        {
          "num": 61,
          "id": "COMPANHEIRO_AVANCADO_AV_1",
          "code": "AV.1",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 1)",
          "text": "Aprender e demonstrar a composição, significado e uso correto da Bandeira Nacional."
        },
        {
          "num": 96,
          "id": "PESQUISADOR_AVANCADO_AV_1",
          "code": "AV.1",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 1)",
          "text": "Conhecer e saber usar de forma adequada a bandeira dos Desbravadores e o bandeirim de Unidade."
        },
        {
          "num": 175,
          "id": "EXCURSIONISTA_AVANCADO_AV_10",
          "code": "AV.10",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 10)",
          "text": "Completar a especialidade de Ordem unida."
        }
      ],
      "specialties": [
        "AR-047"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-21",
      "code": "U-21",
      "title": "Debate e Avaliação Pessoal sobre Autoestima, Amizade e Pressão de Grupo",
      "fullTitle": "Debate e Avaliação Pessoal sobre Autoestima, Amizade e Pressão de Grupo — *Unificado (3 em 1)*",
      "levelText": "🟢 Nível 1: Equivalência 100% Igual (`AUTO_EQUAL`)",
      "levels": [
        "N1"
      ],
      "ruleCode": "AUTO_EQUAL",
      "scenario": "strict",
      "category": "RELACIONAMENTOS",
      "systemRule": "1 roda de conversa avaliativa sobre 'Autoestima, Amizade e Pressão de Grupo' dá baixa automática em PE IV.1, PI IV.1 e EX IV.1.",
      "pedagogicalDetails": "Mesmos temas de debate: realizar um debate/avaliação sobre 'Autoestima' e 'Pressão de Grupo nas Amizades' cumpre integralmente Pesquisador IV.1 (Pressão de grupo), Pioneiro IV.1a/b (Autoestima e Amizade) e Excursionista IV.1a/d (Autoestima e Pressão de grupo).",
      "requirementsCount": 3,
      "requirementIds": [
        "PESQUISADOR_IV_1",
        "PIONEIRO_IV_1",
        "EXCURSIONISTA_IV_1"
      ],
      "requirementNums": [
        85,
        120,
        155
      ],
      "requirements": [
        {
          "num": 85,
          "id": "PESQUISADOR_IV_1",
          "code": "IV.1",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "IV. Desenvolvendo Amizade (Req. 1)",
          "text": "Participar de um debate ou representação sobre a pressão de grupo e identificar a influência que isso exerce sobre suas decisões."
        },
        {
          "num": 120,
          "id": "PIONEIRO_IV_1",
          "code": "IV.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "IV. Desenvolvendo Amizade (Req. 1)",
          "text": "Participar de um debate e fazer uma avaliação pessoal sobre suas atitudes em dois dos seguintes temas: * a) Autoestima * b) Amizade * c) Relacionamentos * d) Otimismo e pessimismo"
        },
        {
          "num": 155,
          "id": "EXCURSIONISTA_IV_1",
          "code": "IV.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "IV. Desenvolvendo Amizade (Req. 1)",
          "text": "Através de uma conversa em grupo ou avaliação pessoal, examinar suas atitudes em dois dos seguintes temas: * a) Autoestima * b) Relacionamento familiar * c) Finanças pessoais * d) Pressão de grupo"
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-22",
      "code": "U-22",
      "title": "Palestra e Conversa sobre Respeito e Relacionamento com os Pais (e Escolha Profissional / Namoro / Sexo)",
      "fullTitle": "Palestra e Conversa sobre Respeito e Relacionamento com os Pais (e Escolha Profissional / Namoro / Sexo) — *Unificado (2 em 1)*",
      "levelText": "🟡 Nível 4: Palestra Conjunta (`SHARED_EVENT`)",
      "levels": [
        "N4"
      ],
      "ruleCode": "SHARED_EVENT",
      "scenario": "strict",
      "category": "RELACIONAMENTOS",
      "systemRule": "1 palestra sobre Relacionamento com os Pais (CO-AV 4 e GU IV.1b) + temas juvenis de Guia.",
      "pedagogicalDetails": "Mesmo tema familiar: conversar sobre respeito aos pais e listar como cuidam de você (Companheiro Av. 4) integrado à aula/palestra sobre 'Como se relacionar com os pais' + 1 segundo tema de Guia (IV.1b).",
      "requirementsCount": 2,
      "requirementIds": [
        "COMPANHEIRO_AVANCADO_AV_4",
        "GUIA_IV_1"
      ],
      "requirementNums": [
        64,
        190
      ],
      "requirements": [
        {
          "num": 64,
          "id": "COMPANHEIRO_AVANCADO_AV_4",
          "code": "AV.4",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 4)",
          "text": "Conversar com seu Conselheiro ou Unidade sobre como demonstrar respeito pelos seus pais ou responsáveis e fazer uma lista mostrando como cuidam de você."
        },
        {
          "num": 190,
          "id": "GUIA_IV_1",
          "code": "IV.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "IV. Desenvolvendo Amizade (Req. 1)",
          "text": "Assistir a uma palestra ou aula e examinar suas atitudes em relação a dois dos seguintes temas: * a) A importância da escolha profissional * b) Como se relacionar com os pais * c) A escolha da pessoa certa para namorar * d) O plano de Deus para o sexo"
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-23",
      "code": "U-23",
      "title": "Temperança: Daniel 1, Prevenção ao Cigarro, Álcool e Drogas, Seminário e Especialidade de Temperança (AM-013)",
      "fullTitle": "Temperança: Daniel 1, Prevenção ao Cigarro, Álcool e Drogas, Seminário e Especialidade de Temperança (AM-013) — *Unificado (7 em 1)*",
      "levelText": "🟣 Nível 3: Absorção por Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "SAUDE",
      "systemRule": "Concluir `AM-013 Temperança` + seminário antidrogas/álcool/fumo dá baixa nos 7 requisitos de abstinência e compromissos.",
      "pedagogicalDetails": "Especialidade contém o requisito: a especialidade de Temperança (AM-013, obrigatória em Excursionista V.1) exige estudar Daniel 1:8 e assinar o compromisso de abstinência (Amigo V.2), estudar os prejuízos do cigarro e assinar compromisso antifumo (Companheiro V.3), fazer cartaz/exposição sobre drogas e tabagismo (Companheiro Av. 6), discutir efeitos do álcool/drogas e redigir compromisso (Pesquisador V.1), ler o livro Temperança de Ellen White ou escrever artigo de saúde (Guia V.2a/c) e assistir seminário/palestra sobre Drogas (+ 1 tema em Guia Av. 8d).",
      "requirementsCount": 7,
      "requirementIds": [
        "AMIGO_V_2",
        "COMPANHEIRO_V_3",
        "COMPANHEIRO_AVANCADO_AV_6",
        "PESQUISADOR_V_1",
        "EXCURSIONISTA_V_1",
        "GUIA_V_2",
        "GUIA_AVANCADO_AV_8"
      ],
      "requirementNums": [
        15,
        50,
        66,
        87,
        157,
        192,
        210
      ],
      "requirements": [
        {
          "num": 15,
          "id": "AMIGO_V_2",
          "code": "V.2",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "V. Saúde e Aptidão Física (Req. 2)",
          "text": "Utilizando a experiência de Daniel: * a) Explicar os princípios de temperança que ele defendeu ou participar em uma apresentação ou encenação sobre Daniel 1. * b) Memorizar e explicar Daniel 1:8. * c) Escrever seu compromisso pessoal de seguir um estilo de vida saudável."
        },
        {
          "num": 50,
          "id": "COMPANHEIRO_V_3",
          "code": "V.3",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "V. Saúde e Aptidão Física (Req. 3)",
          "text": "Aprender sobre os prejuízos que o cigarro causa à saúde e escrever seu compromisso de não fazer uso do fumo."
        },
        {
          "num": 66,
          "id": "COMPANHEIRO_AVANCADO_AV_6",
          "code": "AV.6",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 6)",
          "text": "Escolher um dos seguintes itens: * a) Assistir a um \"Curso como deixar de fumar\" * b) Assistir a dois filmes sobre saúde * c) Elaborar um cartaz sobre o prejuízo das drogas * d) Ajudar a preparar material para uma exposição ou passeata sobre saúde * e) Pesquisar na internet informações sobre saúde e escrever uma página sobre os resultados encontrados"
        },
        {
          "num": 87,
          "id": "PESQUISADOR_V_1",
          "code": "V.1",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "V. Saúde e Aptidão Física (Req. 1)",
          "text": "Escolher uma das atividades abaixo e escrever um texto pessoal para um estilo de vida livre do álcool: * a) Participar de uma discussão em classe sobre os efeitos do álcool no organismo. * b) Assistir a um vídeo sobre o efeito do álcool ou outras drogas no corpo humano e conversar sobre o assunto."
        },
        {
          "num": 157,
          "id": "EXCURSIONISTA_V_1",
          "code": "V.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "V. Saúde e Aptidão Física (Req. 1)",
          "text": "Completar a especialidade de Temperança."
        },
        {
          "num": 192,
          "id": "GUIA_V_2",
          "code": "V.2",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "V. Saúde e Aptidão Física (Req. 2)",
          "text": "Completar uma das seguintes atividades: * a) Escrever uma poesia ou artigo sobre saúde para ser divulgado em uma revista, boletim ou jornal da igreja * b) Individualmente ou em grupo, organizar e participar de uma corrida ou atividade similar e apresentar com antecedência um programa de treinamento físico para este evento * c) Ler as páginas 102-125 do livro *Temperança*, de Ellen White, e apresentar em uma página ou mais, 10 textos selecionados da leitura * d) Completar a especialidade de Nutrição ou liderar um grupo para a especialidade de Cultura física"
        },
        {
          "num": 210,
          "id": "GUIA_AVANCADO_AV_8",
          "code": "AV.8",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 8)",
          "text": "Assistir a um seminário ou apresentar uma palestra sobre dois dos seguintes temas: * a) Aborto * b) Bullying * c) Violência * d) Drogas * e) Infecções sexualmente transmissíveis"
        }
      ],
      "specialties": [
        "AM-013"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-24",
      "code": "U-24",
      "title": "Os 8 Remédios Naturais e Vantagens do Estilo de Vida Adventista (CS-040 Remédios da Natureza)",
      "fullTitle": "Os 8 Remédios Naturais e Vantagens do Estilo de Vida Adventista (CS-040 Remédios da Natureza) — *Unificado (2 em 1)*",
      "levelText": "🟣 Nível 3: Absorção por Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "SAUDE",
      "systemRule": "Apresentação dos 8 Remédios Naturais / especialidade `CS-040 Remédios da Natureza` cumpre PI V.2 e GU V.1.",
      "pedagogicalDetails": "Mesmo tema de saúde: discutir as vantagens do estilo de vida adventista segundo a Bíblia (Pioneiro V.2) e apresentar os 8 remédios naturais dados por Deus (Guia V.1).",
      "requirementsCount": 2,
      "requirementIds": [
        "PIONEIRO_V_2",
        "GUIA_V_1"
      ],
      "requirementNums": [
        122,
        191
      ],
      "requirements": [
        {
          "num": 122,
          "id": "PIONEIRO_V_2",
          "code": "V.2",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "V. Saúde e Aptidão Física (Req. 2)",
          "text": "Discutir as vantagens do estilo de vida adventista de acordo com o que a Bíblia ensina."
        },
        {
          "num": 191,
          "id": "GUIA_V_1",
          "code": "V.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "V. Saúde e Aptidão Física (Req. 1)",
          "text": "Fazer uma apresentação, para o seu Clube ou Unidade, sobre os oito remédios naturais dados por Deus."
        }
      ],
      "specialties": [
        "CS-040"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-25",
      "code": "U-25",
      "title": "Dieta Saudável, Quadro dos Grupos de Alimentos e Cardápio Vegetariano de 3 Dias (CS-008 Nutrição)",
      "fullTitle": "Dieta Saudável, Quadro dos Grupos de Alimentos e Cardápio Vegetariano de 3 Dias (CS-008 Nutrição) — *Unificado (2 em 1)*",
      "levelText": "🟣 Nível 3: Absorção por Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "SAUDE",
      "systemRule": "Oficina da especialidade `CS-008 Nutrição` cumpre o quadro de alimentos (AM V.3) e o cardápio vegetariano de 3 dias (PE-AV 9).",
      "pedagogicalDetails": "Mesmo tema nutricional: aprender princípios de dieta saudável montando quadro de grupos de alimentos (Amigo V.3) e planejar cardápio vegetariano de 3 dias para o acampamento da Unidade (Pesquisador Av. 9).",
      "requirementsCount": 2,
      "requirementIds": [
        "AMIGO_V_3",
        "PESQUISADOR_AVANCADO_AV_9"
      ],
      "requirementNums": [
        16,
        104
      ],
      "requirements": [
        {
          "num": 16,
          "id": "AMIGO_V_3",
          "code": "V.3",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "V. Saúde e Aptidão Física (Req. 3)",
          "text": "Aprender os princípios de uma dieta saudável e ajudar a preparar um quadro com os grupos básicos de alimentos."
        },
        {
          "num": 104,
          "id": "PESQUISADOR_AVANCADO_AV_9",
          "code": "AV.9",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 9)",
          "text": "Planejar um cardápio vegetariano para sua Unidade para um acampamento de três dias e apresentá-lo ao seu instrutor."
        }
      ],
      "specialties": [
        "CS-008"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-26",
      "code": "U-26",
      "title": "Aptidão Física, 1 Co 9:24-27, Programa Diário de Exercícios, Prova Esportiva e Especialidade de Cultura Física (AR-002)",
      "fullTitle": "Aptidão Física, 1 Co 9:24-27, Programa Diário de Exercícios, Prova Esportiva e Especialidade de Cultura Física (AR-002) — *Unificado (5 em 1)*",
      "levelText": "🟣 Nível 3 + 🔵 Nível 2 (`SPECIALTY_ABSORPTION` / `HIERARCHICAL_SCALE`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "SAUDE",
      "systemRule": "Concluir `AR-002 Cultura Física` (liderada pelo Guia V.2d) com rotina diária e prova prática dá baixa nos 5 requisitos físicos.",
      "pedagogicalDetails": "Especialidade contém o requisito: a especialidade de Cultura Física (AR-002, opção de Amigo V.1b e de liderança em Guia V.2d) exige: explicar 1 Co 9:24-27 e princípios de exercícios regulares (Companheiro V.1 e V.2), preparar e assinar programa pessoal de exercícios diários (Pioneiro V.1) e realizar atividade prática de corrida/natação/ciclismo/caminhada com relatório (Pioneiro Av. 3).",
      "requirementsCount": 5,
      "requirementIds": [
        "AMIGO_V_1",
        "COMPANHEIRO_V_1",
        "COMPANHEIRO_V_2",
        "PIONEIRO_V_1",
        "PIONEIRO_AVANCADO_AV_3"
      ],
      "requirementNums": [
        14,
        48,
        49,
        121,
        133
      ],
      "requirements": [
        {
          "num": 14,
          "id": "AMIGO_V_1",
          "code": "V.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "V. Saúde e Aptidão Física (Req. 1)",
          "text": "Completar uma das seguintes especialidades: * a) Natação principiante I * b) Cultura física * c) Nós e amarras * d) Segurança básica na água"
        },
        {
          "num": 48,
          "id": "COMPANHEIRO_V_1",
          "code": "V.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "V. Saúde e Aptidão Física (Req. 1)",
          "text": "Memorizar e explicar I Coríntios 9:24-27."
        },
        {
          "num": 49,
          "id": "COMPANHEIRO_V_2",
          "code": "V.2",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "V. Saúde e Aptidão Física (Req. 2)",
          "text": "Conversar com seu líder sobre a aptidão física e os exercícios físicos regulares que se relacionam com uma vida saudável."
        },
        {
          "num": 121,
          "id": "PIONEIRO_V_1",
          "code": "V.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "V. Saúde e Aptidão Física (Req. 1)",
          "text": "Preparar um programa pessoal de exercícios físicos diários e conversar com seu líder ou conselheiro sobre os princípios de aptidão física. Fazer e assinar um compromisso pessoal de realizar exercícios físicos regularmente."
        },
        {
          "num": 133,
          "id": "PIONEIRO_AVANCADO_AV_3",
          "code": "AV.3",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 3)",
          "text": "Participar de uma das seguintes atividades, apresentando ao final um relatório escrito contendo, no mínimo, duas páginas: * a) Caminhar 10 km * b) Cavalgar 2 km * c) Viajar de canoa durante 2 horas * d) Praticar 15 km de ciclismo * e) Nadar 200 metros * f) Correr 1500 metros * g) Rodar 2 km de patins ou roller"
        }
      ],
      "specialties": [
        "AR-002"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-27",
      "code": "U-27",
      "title": "Primeiros Socorros Básico (CS-003), Resgate Básico (CS-012) e Ferimentos por Animais Peçonhentos (EN-069)",
      "fullTitle": "Primeiros Socorros Básico (CS-003), Resgate Básico (CS-012) e Ferimentos por Animais Peçonhentos (EN-069) — *Unificado (3 em 1)*",
      "levelText": "🟣 Nível 3 + 🔵 Nível 2 (`SPECIALTY_ABSORPTION` / `HIERARCHICAL_SCALE`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "LIDERANCA",
      "systemRule": "Curso conjunto de `CS-003 Primeiros Socorros Básico` (inclui animais peçonhentos EX-AV 8) + `CS-012 Resgate Básico`.",
      "pedagogicalDetails": "Mesma trilha de socorrismo: completar Primeiros Socorros Básico (Pesquisador VIII.2b, cujo currículo inclui atendimento a picadas/ferimentos de animais peçonhentos e não peçonhentos de Excursionista Av. 8) e avançar na prática para Resgate Básico (Pioneiro VIII.3).",
      "requirementsCount": 3,
      "requirementIds": [
        "PESQUISADOR_VIII_2",
        "PIONEIRO_VIII_3",
        "EXCURSIONISTA_AVANCADO_AV_8"
      ],
      "requirementNums": [
        93,
        129,
        173
      ],
      "requirements": [
        {
          "num": 93,
          "id": "PESQUISADOR_VIII_2",
          "code": "VIII.2",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "VIII. Arte de Acampar (Req. 2)",
          "text": "Completar uma das seguintes especialidades: * a) Acampamento III * b) Primeiros socorros – básico"
        },
        {
          "num": 129,
          "id": "PIONEIRO_VIII_3",
          "code": "VIII.3",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "VIII. Arte de Acampar (Req. 3)",
          "text": "Completar a especialidade de Resgate básico."
        },
        {
          "num": 173,
          "id": "EXCURSIONISTA_AVANCADO_AV_8",
          "code": "AV.8",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 8)",
          "text": "Demonstrar conhecimento quanto aos procedimentos necessários em caso de ferimentos por diferentes animais peçonhentos e não peçonhentos."
        }
      ],
      "specialties": [
        "CS-003",
        "CS-012"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-28",
      "code": "U-28",
      "title": "Organização e Participação em Cerimônia Especial do Clube (Investidura, Admissão em Lenço ou Dia Mundial DBV)",
      "fullTitle": "Organização e Participação em Cerimônia Especial do Clube (Investidura, Admissão em Lenço ou Dia Mundial DBV) — *Unificado (2 em 1)*",
      "levelText": "🟢 Nível 1: Mesmo Evento Oficial (`AUTO_EQUAL`)",
      "levels": [
        "N1"
      ],
      "ruleCode": "AUTO_EQUAL",
      "scenario": "strict",
      "category": "LIDERANCA",
      "systemRule": "Na mesma cerimônia (Investidura, Lenço ou Dia Mundial), PE-AV 6 organiza e CO-AV 8 participa/sugere ideias.",
      "pedagogicalDetails": "Mesmo evento do Clube: Pesquisador Av. 6 organiza o evento especial e Companheiro Av. 8 participa e sugere ideias criativas para a mesma cerimônia.",
      "requirementsCount": 2,
      "requirementIds": [
        "COMPANHEIRO_AVANCADO_AV_8",
        "PESQUISADOR_AVANCADO_AV_6"
      ],
      "requirementNums": [
        68,
        101
      ],
      "requirements": [
        {
          "num": 68,
          "id": "COMPANHEIRO_AVANCADO_AV_8",
          "code": "AV.8",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 8)",
          "text": "Participar de uma das seguintes cerimônias e sugerir ideias criativas de como realizá-las: * a) Investidura * b) Admissão em lenço * c) Dia Mundial do Desbravador"
        },
        {
          "num": 101,
          "id": "PESQUISADOR_AVANCADO_AV_6",
          "code": "AV.6",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 6)",
          "text": "Participar na organização de um dos eventos especiais do Clube: * a) Investidura * b) Admissão em lenço * c) Dia Mundial do Desbravador"
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-29",
      "code": "U-29",
      "title": "Organograma da Igreja Local e da Estrutura Administrativa da Divisão Sul-Americana",
      "fullTitle": "Organograma da Igreja Local e da Estrutura Administrativa da Divisão Sul-Americana — *Unificado (2 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "LIDERANCA",
      "systemRule": "Montar o organograma completo (Igreja Local -> Associação -> União -> Divisão) cumpre EX VI.1 (local) e GU VI.1 (Divisão).",
      "pedagogicalDetails": "Escalonado no mesmo tema: preparar o organograma da igreja local e funções dos departamentos (Excursionista VI.1) e o organograma da Igreja Adventista na Divisão (Guia VI.1).",
      "requirementsCount": 2,
      "requirementIds": [
        "EXCURSIONISTA_VI_1",
        "GUIA_VI_1"
      ],
      "requirementNums": [
        158,
        193
      ],
      "requirements": [
        {
          "num": 158,
          "id": "EXCURSIONISTA_VI_1",
          "code": "VI.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "VI. Organização e Liderança (Req. 1)",
          "text": "Preparar um organograma da igreja local e relacionar as funções dos departamentos."
        },
        {
          "num": 193,
          "id": "GUIA_VI_1",
          "code": "VI.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "VI. Organização e Liderança (Req. 1)",
          "text": "Preparar um organograma da estrutura administrativa da Igreja Adventista em sua Divisão."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-30",
      "code": "U-30",
      "title": "Participação em Atividade Social e Programas de Departamentos da Igreja Local",
      "fullTitle": "Participação em Atividade Social e Programas de Departamentos da Igreja Local — *Unificado (2 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "LIDERANCA",
      "systemRule": "Participar de 2 programas de departamentos da igreja (EX VI.2, sendo 1 social) já cumpre automaticamente PI VI.2 (1 atividade social).",
      "pedagogicalDetails": "Escalonado: participar de 2 programas envolvendo diferentes departamentos da igreja local (Excursionista VI.2), sendo 1 deles uma atividade social da igreja (Pioneiro VI.2).",
      "requirementsCount": 2,
      "requirementIds": [
        "PIONEIRO_VI_2",
        "EXCURSIONISTA_VI_2"
      ],
      "requirementNums": [
        124,
        159
      ],
      "requirements": [
        {
          "num": 124,
          "id": "PIONEIRO_VI_2",
          "code": "VI.2",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "VI. Organização e Liderança (Req. 2)",
          "text": "Participar de uma atividade social de sua igreja."
        },
        {
          "num": 159,
          "id": "EXCURSIONISTA_VI_2",
          "code": "VI.2",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "VI. Organização e Liderança (Req. 2)",
          "text": "Participar de dois programas envolvendo diferentes departamentos da igreja local."
        }
      ],
      "specialties": [],
      "hierarchicalScale": [
        {
          "num": 159,
          "id": "EXCURSIONISTA_VI_2",
          "label": "Participar de 2 programas de departamentos da igreja (Excursionista)",
          "rank": 2
        },
        {
          "num": 124,
          "id": "PIONEIRO_VI_2",
          "label": "Participar de 1 atividade social da igreja (Pioneiro)",
          "rank": 1
        }
      ],
      "enabled": true
    },
    {
      "id": "U-31",
      "code": "U-31",
      "title": "Gestão Financeira Cristã: Especialidades de Mordomia (AM-EB-021) e Orçamento Familiar (HD-006)",
      "fullTitle": "Gestão Financeira Cristã: Especialidades de Mordomia (AM-EB-021) e Orçamento Familiar (HD-006) — *Unificado (2 em 1)*",
      "levelText": "🟣 Nível 3: Dupla de Especialidades Irmãs (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "LIDERANCA",
      "systemRule": "Oficina conjunta de `AM-EB-021 Mordomia` e `HD-006 Orçamento Familiar` (também cobre Finanças Pessoais de EX IV.1c).",
      "pedagogicalDetails": "Mesmo eixo financeiro (Guia Av. 1 e Guia Av. 10): ambas trabalham planejamento financeiro familiar, fidelidade nos dízimos/ofertas e controle de gastos.",
      "requirementsCount": 2,
      "requirementIds": [
        "GUIA_AVANCADO_AV_1",
        "GUIA_AVANCADO_AV_10"
      ],
      "requirementNums": [
        203,
        212
      ],
      "requirements": [
        {
          "num": 203,
          "id": "GUIA_AVANCADO_AV_1",
          "code": "AV.1",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 1)",
          "text": "Completar a especialidade de Mordomia."
        },
        {
          "num": 212,
          "id": "GUIA_AVANCADO_AV_10",
          "code": "AV.10",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 10)",
          "text": "Completar a especialidade de Orçamento familiar."
        }
      ],
      "specialties": [
        "AM-EB-021",
        "HD-006"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-32",
      "code": "U-32",
      "title": "Catálogo Botânico/Zoológico (10 a 25 Espécies) + Especialidades de Flores (EN-005) e Árvores/Aves (EN-006 / EN-003)",
      "fullTitle": "Catálogo Botânico/Zoológico (10 a 25 Espécies) + Especialidades de Flores (EN-005) e Árvores/Aves (EN-006 / EN-003) — *Unificado (5 em 1)*",
      "levelText": "🔵 Nível 2 + 🟣 Nível 3 (`HIERARCHICAL_SCALE` / `SPECIALTY_ABSORPTION`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "NATUREZA",
      "systemRule": "Catálogo de 25 flores e 25 folhas/árvores (PI-AV 9) engloba 10 flores (AM-AV 6) e 12 árvores (CO-AV 7) + especialidades `EN-005`/`EN-006`.",
      "pedagogicalDetails": "Escalonado + Especialidade: identificar 25 flores silvestres e 25 folhas de árvores (Pioneiro Av. 9a/c) engloba as 10 flores silvestres de Amigo Av. 6 (+ 10 insetos) e as 12 árvores nativas de Companheiro Av. 7 (+ 12 aves nativas), cumprindo diretamente as especialidades de Árvores/Aves (Companheiro VII.2) e Flores (Pesquisador VII.2).",
      "requirementsCount": 5,
      "requirementIds": [
        "AMIGO_AVANCADO_AV_6",
        "COMPANHEIRO_VII_2",
        "COMPANHEIRO_AVANCADO_AV_7",
        "PESQUISADOR_VII_2",
        "PIONEIRO_AVANCADO_AV_9"
      ],
      "requirementNums": [
        31,
        55,
        67,
        91,
        139
      ],
      "requirements": [
        {
          "num": 31,
          "id": "AMIGO_AVANCADO_AV_6",
          "code": "AV.6",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 6)",
          "text": "Conhecer e identificar 10 flores silvestres e 10 insetos de sua região."
        },
        {
          "num": 55,
          "id": "COMPANHEIRO_VII_2",
          "code": "VII.2",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "VII. Estudo da Natureza (Req. 2)",
          "text": "Completar uma das seguintes especialidades: * a) Anfíbios * b) Aves * c) Aves domésticas * d) Pecuária * e) Répteis * f) Moluscos * g) Árvores * h) Arbustos"
        },
        {
          "num": 67,
          "id": "COMPANHEIRO_AVANCADO_AV_7",
          "code": "AV.7",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 7)",
          "text": "Identificar e descrever 12 aves nativas e 12 árvores nativas."
        },
        {
          "num": 91,
          "id": "PESQUISADOR_VII_2",
          "code": "VII.2",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "VII. Estudo da Natureza (Req. 2)",
          "text": "Completar uma das especialidades abaixo: * a) Astronomia * b) Cactos * c) Climatologia * d) Flores * e) Rastreio de animais"
        },
        {
          "num": 139,
          "id": "PIONEIRO_AVANCADO_AV_9",
          "code": "AV.9",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 9)",
          "text": "Pesquisar e identificar, através de fotografia, exposição ou ao vivo, um dos seguintes itens: * a) 25 folhas de árvores * b) 25 rochas e minerais * c) 25 flores silvestres * d) 25 borboletas e mariposas * e) 25 conchas"
        }
      ],
      "specialties": [
        "EN-005",
        "EN-006"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-33",
      "code": "U-33",
      "title": "Plantas Silvestres Comestíveis vs. Plantas Tóxicas/Venenosas + Especialidade EN-043 (Estudo da Natureza Livre)",
      "fullTitle": "Plantas Silvestres Comestíveis vs. Plantas Tóxicas/Venenosas + Especialidade EN-043 (Estudo da Natureza Livre) — *Unificado (4 em 1)*",
      "levelText": "🟣 Nível 3: Absorção por Especialidade (`SPECIALTY_ABSORPTION`)",
      "levels": [
        "N3"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "NATUREZA",
      "systemRule": "Cursar `EN-043 Plantas Silvestres Comestíveis` cumpre a vaga de Natureza (PI/EX VII.2) e os requisitos práticos PI-AV 7a e EX-AV 7.",
      "pedagogicalDetails": "Especialidade contém o requisito: a especialidade Plantas Silvestres Comestíveis (EN-043) cumpre a especialidade livre de Estudo da Natureza de Pioneiro (VII.2) ou Excursionista (VII.2) e exige identificar 10+ plantas silvestres comestíveis (Pioneiro Av. 7a) sabendo diferenciá-las de plantas tóxicas/venenosas (Excursionista Av. 7).",
      "requirementsCount": 4,
      "requirementIds": [
        "PIONEIRO_VII_2",
        "PIONEIRO_AVANCADO_AV_7",
        "EXCURSIONISTA_VII_2",
        "EXCURSIONISTA_AVANCADO_AV_7"
      ],
      "requirementNums": [
        126,
        137,
        162,
        172
      ],
      "requirements": [
        {
          "num": 126,
          "id": "PIONEIRO_VII_2",
          "code": "VII.2",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "VII. Estudo da Natureza (Req. 2)",
          "text": "Completar uma especialidade não realizada anteriormente em Estudo da natureza."
        },
        {
          "num": 137,
          "id": "PIONEIRO_AVANCADO_AV_7",
          "code": "AV.7",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 7)",
          "text": "Completar um dos seguintes itens: * a) Pesquisar e identificar 10 variedades de plantas silvestres comestíveis. * b) Ser capaz de enviar e receber 35 letras por minuto pelo código semafórico. * c) Ser capaz de enviar e receber 35 letras por minuto através do código náutico, usando o código internacional. * d) Ser capaz de apresentar e entender Mateus 24 em Libras (língua de sinais). * e) Preparar o Salmo 23 em braille."
        },
        {
          "num": 162,
          "id": "EXCURSIONISTA_VII_2",
          "code": "VII.2",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "VII. Estudo da Natureza (Req. 2)",
          "text": "Completar uma especialidade em Estudo da natureza, não realizada anteriormente."
        },
        {
          "num": 172,
          "id": "EXCURSIONISTA_AVANCADO_AV_7",
          "code": "AV.7",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 7)",
          "text": "Demonstrar conhecimento para encontrar alimentos através de plantas silvestres de sua região e saber diferenciá-las de plantas tóxicas/venenosas."
        }
      ],
      "specialties": [
        "EN-043"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-34",
      "code": "U-34",
      "title": "Expedição de Caminhada Escalonada (5 km → 6 km → 10 km → 20 km), Regras de Caminhada, Técnicas de Trilhas e Excursionismo com Mochila (AR-056)",
      "fullTitle": "Expedição de Caminhada Escalonada (5 km → 6 km → 10 km → 20 km), Regras de Caminhada, Técnicas de Trilhas e Excursionismo com Mochila (AR-056) — *Unificado (7 em 1)*",
      "levelText": "🔵 Nível 2: Escalonado / Hierárquico (`HIERARCHICAL_SCALE`)",
      "levels": [
        "N2"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "ACAMPAMENTO",
      "systemRule": "Trilha de 20 km > 10 km > 6 km > 5 km com regras, lista de equipamentos e `AR-056 Excursionismo com Mochila`: a distância maior valida as menores.",
      "pedagogicalDetails": "Mesma atividade física escalonada: planejar e executar a expedição da especialidade Excursionismo Pedestre com Mochila (Companheiro Av. 11) com regras de caminhada/perdido (Amigo VIII.3), lista de roupa/calçado/equipamento (Pesquisador Av. 5) e técnicas de trilhas em diferentes terrenos (Excursionista Av. 9), validando os marcos de 5 km (Amigo VI.1), 6 km (Companheiro Av. 5), 10 km (Pesquisador Av. 5 / Pioneiro Av. 3a) e 20 km com pernoite e anotações (Excursionista VIII.1).",
      "requirementsCount": 7,
      "requirementIds": [
        "AMIGO_VI_1",
        "AMIGO_VIII_3",
        "COMPANHEIRO_AVANCADO_AV_5",
        "COMPANHEIRO_AVANCADO_AV_11",
        "PESQUISADOR_AVANCADO_AV_5",
        "EXCURSIONISTA_VIII_1",
        "EXCURSIONISTA_AVANCADO_AV_9"
      ],
      "requirementNums": [
        17,
        23,
        65,
        71,
        100,
        163,
        174
      ],
      "requirements": [
        {
          "num": 17,
          "id": "AMIGO_VI_1",
          "code": "VI.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "VI. Organização e Liderança (Req. 1)",
          "text": "Através da observação, acompanhar todo o processo de planejamento até a execução de uma caminhada de 5 km."
        },
        {
          "num": 23,
          "id": "AMIGO_VIII_3",
          "code": "VIII.3",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "VIII. Arte de Acampar (Req. 3)",
          "text": "Apresentar dez regras para uma caminhada e explicar o que fazer quando estiver perdido."
        },
        {
          "num": 65,
          "id": "COMPANHEIRO_AVANCADO_AV_5",
          "code": "AV.5",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 5)",
          "text": "Participar de uma caminhada de 6 km, preparando, ao final, um relatório de uma página."
        },
        {
          "num": 71,
          "id": "COMPANHEIRO_AVANCADO_AV_11",
          "code": "AV.11",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 11)",
          "text": "Completar a especialidade de Excursionismo pedestre com mochila."
        },
        {
          "num": 100,
          "id": "PESQUISADOR_AVANCADO_AV_5",
          "code": "AV.5",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 5)",
          "text": "Participar de uma caminhada de 10 km e fazer uma lista dos equipamentos necessários, incluindo roupa e calçado que devem ser usados."
        },
        {
          "num": 163,
          "id": "EXCURSIONISTA_VIII_1",
          "code": "VIII.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "VIII. Arte de Acampar (Req. 1)",
          "text": "Com um grupo de, no mínimo, quatro pessoas e com a presença de um conselheiro adulto e experiente, andar pelo menos 20 km numa área rural ou deserta, incluindo uma noite ao ar livre ou em barraca. Planejar a expedição em detalhes antes da saída. Durante a caminhada, efetuar anotações sobre o terreno, flora e fauna observados. Depois, usando as anotações, participar de uma discussão em grupo, dirigida por seu conselheiro."
        },
        {
          "num": 174,
          "id": "EXCURSIONISTA_AVANCADO_AV_9",
          "code": "AV.9",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 9)",
          "text": "Demonstrar técnicas para percorrer trilhas em diferentes tipos de terrenos, como: desertos, florestas, pântanos e rios."
        }
      ],
      "specialties": [
        "AR-056"
      ],
      "hierarchicalScale": [
        {
          "num": 163,
          "id": "EXCURSIONISTA_VIII_1",
          "label": "Caminhada de 20 km com pernoite e anotações (Excursionista)",
          "distanceKm": 20,
          "rank": 4
        },
        {
          "num": 100,
          "id": "PESQUISADOR_AVANCADO_AV_5",
          "label": "Caminhada de 10 km com lista de equipamentos (Pesquisador Av.)",
          "distanceKm": 10,
          "rank": 3
        },
        {
          "num": 133,
          "id": "PIONEIRO_AVANCADO_AV_3",
          "label": "Caminhar 10 km com relatório (Pioneiro Av.)",
          "distanceKm": 10,
          "rank": 3
        },
        {
          "num": 65,
          "id": "COMPANHEIRO_AVANCADO_AV_5",
          "label": "Caminhada de 6 km com relatório (Companheiro Av.)",
          "distanceKm": 6,
          "rank": 2
        },
        {
          "num": 17,
          "id": "AMIGO_VI_1",
          "label": "Planejamento e execução de caminhada de 5 km (Amigo)",
          "distanceKm": 5,
          "rank": 1
        },
        {
          "num": 23,
          "id": "AMIGO_VIII_3",
          "label": "10 regras de caminhada e conduta perdido (Amigo)",
          "rank": 0
        },
        {
          "num": 174,
          "id": "EXCURSIONISTA_AVANCADO_AV_9",
          "label": "Técnicas para percorrer trilhas em diferentes terrenos (Excursionista Av.)",
          "rank": 0
        },
        {
          "num": 71,
          "id": "COMPANHEIRO_AVANCADO_AV_11",
          "label": "Especialidade de Excursionismo pedestre com mochila (Companheiro Av.)",
          "rank": 0
        }
      ],
      "enabled": true
    },
    {
      "id": "U-35",
      "code": "U-35",
      "title": "Orientação e Navegação: Pista de 10 Sinais, Pontos Cardeais sem Bússola, Rosa dos Ventos, GPS e Especialidade Mapa e Bússola (AR-021)",
      "fullTitle": "Orientação e Navegação: Pista de 10 Sinais, Pontos Cardeais sem Bússola, Rosa dos Ventos, GPS e Especialidade Mapa e Bússola (AR-021) — *Unificado (4 em 1)*",
      "levelText": "🟣 Nível 3 + 🔵 Nível 2 (`SPECIALTY_ABSORPTION` / `HIERARCHICAL_SCALE`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "ACAMPAMENTO",
      "systemRule": "Oficina de `AR-021 Mapa e Bússola` + GPS + Pista de 10 sinais cobre orientação sem bússola (CO), urbana (PE) e avançada (PI-AV).",
      "pedagogicalDetails": "Mesma técnica progressiva: preparar/seguir pista de 10 sinais (Amigo VIII.4), achar pontos cardeais sem bússola e desenhar Rosa dos Ventos (Companheiro VIII.1), localizar endereços com bússola/GPS (Pesquisador VIII.3) e completar a especialidade de Mapa e Bússola (Pioneiro Av. 4).",
      "requirementsCount": 4,
      "requirementIds": [
        "AMIGO_VIII_4",
        "COMPANHEIRO_VIII_1",
        "PESQUISADOR_VIII_3",
        "PIONEIRO_AVANCADO_AV_4"
      ],
      "requirementNums": [
        24,
        57,
        94,
        134
      ],
      "requirements": [
        {
          "num": 24,
          "id": "AMIGO_VIII_4",
          "code": "VIII.4",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "VIII. Arte de Acampar (Req. 4)",
          "text": "Aprender os sinais para seguir uma pista. Preparar e seguir uma pista de no mínimo 10 sinais, que também possa ser seguida por outros."
        },
        {
          "num": 57,
          "id": "COMPANHEIRO_VIII_1",
          "code": "VIII.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "VIII. Arte de Acampar (Req. 1)",
          "text": "Descobrir os pontos cardeais sem a ajuda de uma bússola e desenhar a Rosa dos Ventos."
        },
        {
          "num": 94,
          "id": "PESQUISADOR_VIII_3",
          "code": "VIII.3",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "VIII. Arte de Acampar (Req. 3)",
          "text": "Aprender a usar uma bússola ou GPS (urbano ou de campo) e demonstrar sua habilidade encontrando endereços em uma zona urbana."
        },
        {
          "num": 134,
          "id": "PIONEIRO_AVANCADO_AV_4",
          "code": "AV.4",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 4)",
          "text": "Completar a especialidade de Mapa e bússola."
        }
      ],
      "specialties": [
        "AR-021"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-36",
      "code": "U-36",
      "title": "Nós (14 Nós + Quadro de 15 Nós), 4 Amarras Básicas, Construção de Móvel em Tamanho Real e Portal + Especialidade de Pioneirias (AR-101)",
      "fullTitle": "Nós (14 Nós + Quadro de 15 Nós), 4 Amarras Básicas, Construção de Móvel em Tamanho Real e Portal + Especialidade de Pioneirias (AR-101) — *Unificado (7 em 1)*",
      "levelText": "🔵 Nível 2 + 🟣 Nível 3 (`HIERARCHICAL_SCALE` / `SPECIALTY_ABSORPTION`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "ACAMPAMENTO",
      "systemRule": "14 nós (AM) + 4 novos (CO) = Quadro de 15 nós (CO-AV 10); construir 1 móvel em tamanho real + portal com 4 amarras valida PE-AV 8, EX VIII.2, EX-AV 5 e GU VIII.3.",
      "pedagogicalDetails": "Mesma prática escalonada de pioneiria: aprender os 14 nós de Amigo (VIII.1) + 4 novos dos 9 nós de Companheiro (VIII.3) monta o quadro de 15 nós (Companheiro Av. 10); fazer as 4 amarras básicas construindo em Unidade 1 móvel em tamanho real e 1 portal cumpre Pesquisador Av. 8, Excursionista VIII.2 (Pioneirias), Excursionista Av. 5 e Guia VIII.3.",
      "requirementsCount": 7,
      "requirementIds": [
        "AMIGO_VIII_1",
        "COMPANHEIRO_VIII_3",
        "COMPANHEIRO_AVANCADO_AV_10",
        "PESQUISADOR_AVANCADO_AV_8",
        "EXCURSIONISTA_VIII_2",
        "EXCURSIONISTA_AVANCADO_AV_5",
        "GUIA_VIII_3"
      ],
      "requirementNums": [
        21,
        59,
        70,
        103,
        164,
        170,
        200
      ],
      "requirements": [
        {
          "num": 21,
          "id": "AMIGO_VIII_1",
          "code": "VIII.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "VIII. Arte de Acampar (Req. 1)",
          "text": "Demonstrar como cuidar corretamente de uma corda. Fazer e explicar o uso prático dos seguintes nós: * a) Simples * b) Cego * c) Direito * d) Cirurgião * e) Laís de guia * f) Laís de guia duplo * g) Escota * h) Catau * i) Pescador * j) Fateixa * k) Volta do fiel * l) Nó de gancho * m) Volta da ribeira * n) Ordinário"
        },
        {
          "num": 59,
          "id": "COMPANHEIRO_VIII_3",
          "code": "VIII.3",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "VIII. Arte de Acampar (Req. 3)",
          "text": "Aprender ou recapitular os seguintes nós: * a) Oito * b) Volta do salteador * c) Duplo * d) Caminhoneiro * e) Direito * f) Volta do Fiel * g) Escota * h) Laís de Guia * i) Simples"
        },
        {
          "num": 70,
          "id": "COMPANHEIRO_AVANCADO_AV_10",
          "code": "AV.10",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 10)",
          "text": "Preparar um quadro com 15 nós diferentes."
        },
        {
          "num": 103,
          "id": "PESQUISADOR_AVANCADO_AV_8",
          "code": "AV.8",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 8)",
          "text": "Aprender a fazer as quatro amarras básicas e construir um móvel de acampamento."
        },
        {
          "num": 164,
          "id": "EXCURSIONISTA_VIII_2",
          "code": "VIII.2",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "VIII. Arte de Acampar (Req. 2)",
          "text": "Completar a especialidade de Pioneirias."
        },
        {
          "num": 170,
          "id": "EXCURSIONISTA_AVANCADO_AV_5",
          "code": "AV.5",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 5)",
          "text": "Com sua Unidade, construir um móvel de acampamento e um portal para o Clube."
        },
        {
          "num": 200,
          "id": "GUIA_VIII_3",
          "code": "VIII.3",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "VIII. Arte de Acampar (Req. 3)",
          "text": "Construir e utilizar um móvel de acampamento em tamanho real, com nós e amarras."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-37",
      "code": "U-37",
      "title": "Faca/Machadinha, Fogo Natural, Fogo Refletor, Fogo na Chuva, Cozinhar 1 a 3 Refeições ao Ar Livre e Especialidade de Fogueiras (AR-020)",
      "fullTitle": "Faca/Machadinha, Fogo Natural, Fogo Refletor, Fogo na Chuva, Cozinhar 1 a 3 Refeições ao Ar Livre e Especialidade de Fogueiras (AR-020) — *Unificado (9 em 1)*",
      "levelText": "🟣 Nível 3 + 🔵 Nível 2 (`SPECIALTY_ABSORPTION` / `HIERARCHICAL_SCALE`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "ACAMPAMENTO",
      "systemRule": "Concluir `AR-020 Fogueiras e Cozinha ao Ar Livre` cozinhando 3 refeições (GU) valida automaticamente 2 refeições (PE), 1 refeição (CO-AV), fogo natural, refletor, na chuva e machadinha.",
      "pedagogicalDetails": "Especialidade contém o requisito + escalonamento: a especialidade Fogueiras e Cozinha ao Ar Livre (AR-020, Pioneiro Av. 10) exige segurança e uso de faca/machadinha (Amigo Av. 8 e Pioneiro Av. 5), fogueira com materiais naturais (Amigo Av. 7), fogo refletor (Pioneiro VIII.1), fogo na chuva (Pioneiro Av. 6) e preparo de refeições ao ar livre — onde cozinhar 3 refeições (Guia VIII.2) engloba 2 refeições + 6 segredos de acampamento (Pesquisador VIII.1) e 1 refeição (Companheiro Av. 9).",
      "requirementsCount": 9,
      "requirementIds": [
        "AMIGO_AVANCADO_AV_7",
        "AMIGO_AVANCADO_AV_8",
        "COMPANHEIRO_AVANCADO_AV_9",
        "PESQUISADOR_VIII_1",
        "PIONEIRO_VIII_1",
        "PIONEIRO_AVANCADO_AV_5",
        "PIONEIRO_AVANCADO_AV_6",
        "PIONEIRO_AVANCADO_AV_10",
        "GUIA_VIII_2"
      ],
      "requirementNums": [
        32,
        33,
        69,
        92,
        127,
        135,
        136,
        140,
        199
      ],
      "requirements": [
        {
          "num": 32,
          "id": "AMIGO_AVANCADO_AV_7",
          "code": "AV.7",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 7)",
          "text": "Começar uma fogueira usando materiais naturais, e mantê-la acesa."
        },
        {
          "num": 33,
          "id": "AMIGO_AVANCADO_AV_8",
          "code": "AV.8",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 8)",
          "text": "Usar corretamente uma faca, facão ou uma machadinha e conhecer 10 regras para usá-los com segurança."
        },
        {
          "num": 69,
          "id": "COMPANHEIRO_AVANCADO_AV_9",
          "code": "AV.9",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 9)",
          "text": "Preparar uma refeição em uma fogueira durante um acampamento do Clube ou Unidade."
        },
        {
          "num": 92,
          "id": "PESQUISADOR_VIII_1",
          "code": "VIII.1",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "VIII. Arte de Acampar (Req. 1)",
          "text": "Apresentar seis segredos para um bom acampamento. Participar de um acampamento de final de semana, planejando e cozinhando duas refeições."
        },
        {
          "num": 127,
          "id": "PIONEIRO_VIII_1",
          "code": "VIII.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "VIII. Arte de Acampar (Req. 1)",
          "text": "Fazer um fogo refletor e demonstrar seu uso."
        },
        {
          "num": 135,
          "id": "PIONEIRO_AVANCADO_AV_5",
          "code": "AV.5",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 5)",
          "text": "Demonstrar habilidade no uso correto de uma machadinha."
        },
        {
          "num": 136,
          "id": "PIONEIRO_AVANCADO_AV_6",
          "code": "AV.6",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 6)",
          "text": "Ser capaz de acender uma fogueira em dia de chuva, saber como conseguir lenha seca e manter o fogo aceso."
        },
        {
          "num": 140,
          "id": "PIONEIRO_AVANCADO_AV_10",
          "code": "AV.10",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 10)",
          "text": "Completar a especialidade de Fogueiras e cozinha ao ar livre."
        },
        {
          "num": 199,
          "id": "GUIA_VIII_2",
          "code": "VIII.2",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "VIII. Arte de Acampar (Req. 2)",
          "text": "Planejar, preparar e cozinhar três refeições ao ar livre."
        }
      ],
      "specialties": [
        "AR-020"
      ],
      "hierarchicalScale": [
        {
          "num": 199,
          "id": "GUIA_VIII_2",
          "label": "Planejar, preparar e cozinhar 3 refeições ao ar livre (Guia)",
          "meals": 3,
          "rank": 3
        },
        {
          "num": 92,
          "id": "PESQUISADOR_VIII_1",
          "label": "6 segredos de acampamento + planejar e cozinhar 2 refeições (Pesquisador)",
          "meals": 2,
          "rank": 2
        },
        {
          "num": 69,
          "id": "COMPANHEIRO_AVANCADO_AV_9",
          "label": "Preparar 1 refeição em fogueira durante acampamento (Companheiro Av.)",
          "meals": 1,
          "rank": 1
        }
      ],
      "enabled": true
    },
    {
      "id": "U-38",
      "code": "U-38",
      "title": "Acampamento Prático de Fim de Semana, Montagem de Barraca, 3 Tipos de Abrigo e Trilha de Especialidades Campestres (Acampamento I/II, Arte de Acampar, Vida Silvestre e Liderança Campestre)",
      "fullTitle": "Acampamento Prático de Fim de Semana, Montagem de Barraca, 3 Tipos de Abrigo e Trilha de Especialidades Campestres (Acampamento I/II, Arte de Acampar, Vida Silvestre e Liderança Campestre) — *Unificado (13 em 1)*",
      "levelText": "🔵 Nível 2 + 🟣 Nível 3 (`HIERARCHICAL_SCALE` / `SPECIALTY_ABSORPTION`)",
      "levels": [
        "N2",
        "N3"
      ],
      "ruleCode": "HIERARCHICAL_SCALE",
      "scenario": "strict",
      "category": "ACAMPAMENTO",
      "systemRule": "1 Acampamento de fim de semana em pioneiria montando barraca e 3 abrigos cumpre a prática de campo das 6 classes e especialidades campestres.",
      "pedagogicalDetails": "Mesma prática campestre e especialidades de acampamento: planejar e participar de um acampamento de fim de semana com mochila equipada e estrutura de pioneiria (Companheiro VI.2 e VIII.2, Pioneiro VIII.2, Guia VIII.1) armando barraca (Amigo VII.3) e projetando/usando 3 tipos de abrigo (Guia Av. 7), cumprindo em campo Acampamento I (Amigo VIII.2), Arte de Acampar (Amigo Av. 5), Acampamento II (Companheiro V.4b), Vida Silvestre (Excursionista Av. 11), Liderança Campestre (Guia Av. 9) e as especialidades do Mestrado em Vida Campestre (Guia VIII.4d e Guia Av. 6).",
      "requirementsCount": 13,
      "requirementIds": [
        "AMIGO_VII_3",
        "AMIGO_VIII_2",
        "AMIGO_AVANCADO_AV_5",
        "COMPANHEIRO_V_4",
        "COMPANHEIRO_VI_2",
        "COMPANHEIRO_VIII_2",
        "PIONEIRO_VIII_2",
        "EXCURSIONISTA_AVANCADO_AV_11",
        "GUIA_VIII_1",
        "GUIA_VIII_4",
        "GUIA_AVANCADO_AV_6",
        "GUIA_AVANCADO_AV_7",
        "GUIA_AVANCADO_AV_9"
      ],
      "requirementNums": [
        20,
        22,
        30,
        51,
        53,
        58,
        128,
        176,
        198,
        201,
        208,
        209,
        211
      ],
      "requirements": [
        {
          "num": 20,
          "id": "AMIGO_VII_3",
          "code": "VII.3",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "VII. Estudo da Natureza (Req. 3)",
          "text": "Aprender e montar uma barraca em local apropriado."
        },
        {
          "num": 22,
          "id": "AMIGO_VIII_2",
          "code": "VIII.2",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "VIII. Arte de Acampar (Req. 2)",
          "text": "Completar a especialidade de Acampamento I."
        },
        {
          "num": 30,
          "id": "AMIGO_AVANCADO_AV_5",
          "code": "AV.5",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 5)",
          "text": "Completar a especialidade de Arte de acampar."
        },
        {
          "num": 51,
          "id": "COMPANHEIRO_V_4",
          "code": "V.4",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "V. Saúde e Aptidão Física (Req. 4)",
          "text": "Completar uma das seguintes especialidades: * a) Natação principiante II * b) Acampamento II"
        },
        {
          "num": 53,
          "id": "COMPANHEIRO_VI_2",
          "code": "VI.2",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "VI. Organização e Liderança (Req. 2)",
          "text": "Ajudar no planejamento de uma excursão ou acampamento com sua Unidade ou Clube, envolvendo pelo menos um pernoite."
        },
        {
          "num": 58,
          "id": "COMPANHEIRO_VIII_2",
          "code": "VIII.2",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "VIII. Arte de Acampar (Req. 2)",
          "text": "Participar de um acampamento de final de semana e fazer um relatório destacando o que mais lhe impressionou positivamente."
        },
        {
          "num": 128,
          "id": "PIONEIRO_VIII_2",
          "code": "VIII.2",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "VIII. Arte de Acampar (Req. 2)",
          "text": "Participar de um acampamento de final de semana, arrumando de forma apropriada sua bolsa ou mochila com o equipamento pessoal necessário."
        },
        {
          "num": 176,
          "id": "EXCURSIONISTA_AVANCADO_AV_11",
          "code": "AV.11",
          "class_name": "Excursionista na Mata",
          "class_slug": "excursionista-avancado",
          "section_info": "Classe Avançada (Req. 11)",
          "text": "Completar a especialidade de Vida silvestre."
        },
        {
          "num": 198,
          "id": "GUIA_VIII_1",
          "code": "VIII.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "VIII. Arte de Acampar (Req. 1)",
          "text": "Participar com sua Unidade de um acampamento com estrutura de pioneiria, planejar o que deve ser levado e o que vai acontecer neste acampamento."
        },
        {
          "num": 201,
          "id": "GUIA_VIII_4",
          "code": "VIII.4",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "VIII. Arte de Acampar (Req. 4)",
          "text": "Completar uma especialidade, não realizada anteriormente, que possa ser contada para um dos mestrados abaixo: * a) Aquática * b) Esportes * c) Atividades recreativas * d) Vida campestre"
        },
        {
          "num": 208,
          "id": "GUIA_AVANCADO_AV_6",
          "code": "AV.6",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 6)",
          "text": "Completar uma especialidade, não realizada anteriormente, para o mestrado em Vida campestre."
        },
        {
          "num": 209,
          "id": "GUIA_AVANCADO_AV_7",
          "code": "AV.7",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 7)",
          "text": "Projetar três tipos diferentes de abrigo, explicar seu uso e utilizar um deles em um acampamento."
        },
        {
          "num": 211,
          "id": "GUIA_AVANCADO_AV_9",
          "code": "AV.9",
          "class_name": "Guia de Exploração",
          "class_slug": "guia-avancado",
          "section_info": "Classe Avançada (Req. 9)",
          "text": "Completar a especialidade de Liderança campestre."
        }
      ],
      "specialties": [],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-39",
      "code": "U-39",
      "title": "Especialidade em Artes e Habilidades Manuais (HM-031 Modelagem em Gesso / HM-055 Biscuit) + 6 Pegadas e 3 Moldes",
      "fullTitle": "Especialidade em Artes e Habilidades Manuais (HM-031 Modelagem em Gesso / HM-055 Biscuit) + 6 Pegadas e 3 Moldes — *Unificado (4 em 1)*",
      "levelText": "🟣 Nível 3 + 🟡 Nível 4 (`SPECIALTY_ABSORPTION` / `SHARED_EVENT`)",
      "levels": [
        "N3",
        "N4"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "ESPECIALIDADES",
      "systemRule": "Oficina de `HM-031 Modelagem em Gesso` ou `HM-055 Biscuit` cumpre Artes Manuais (AM/CO/PE IX.1) e produz os 3 moldes de pegadas (PE-AV 7).",
      "pedagogicalDetails": "Mesma área de especialidade + requisito prático: uma oficina de Modelagem em Gesso (HM-031) ou Biscuit (HM-055) cumpre a especialidade de Artes e Habilidades Manuais de Amigo (IX.1), Companheiro (IX.1) e Pesquisador (IX.1) e já confecciona os 3 moldes de pegadas exigidos em Pesquisador Av. 7 (ID 102).",
      "requirementsCount": 4,
      "requirementIds": [
        "AMIGO_IX_1",
        "COMPANHEIRO_IX_1",
        "PESQUISADOR_IX_1",
        "PESQUISADOR_AVANCADO_AV_7"
      ],
      "requirementNums": [
        25,
        60,
        95,
        102
      ],
      "requirements": [
        {
          "num": 25,
          "id": "AMIGO_IX_1",
          "code": "IX.1",
          "class_name": "Amigo",
          "class_slug": "amigo",
          "section_info": "IX. Estilo de Vida (Req. 1)",
          "text": "Completar uma especialidade na área de Artes e habilidades manuais."
        },
        {
          "num": 60,
          "id": "COMPANHEIRO_IX_1",
          "code": "IX.1",
          "class_name": "Companheiro",
          "class_slug": "companheiro",
          "section_info": "IX. Estilo de Vida (Req. 1)",
          "text": "Completar uma especialidade não realizada anteriormente na seção de Artes e habilidades manuais."
        },
        {
          "num": 95,
          "id": "PESQUISADOR_IX_1",
          "code": "IX.1",
          "class_name": "Pesquisador",
          "class_slug": "pesquisador",
          "section_info": "IX. Estilo de Vida (Req. 1)",
          "text": "Completar uma especialidade, não realizada anteriormente, em Artes e habilidades manuais."
        },
        {
          "num": 102,
          "id": "PESQUISADOR_AVANCADO_AV_7",
          "code": "AV.7",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 7)",
          "text": "Identificar seis pegadas de animais ou aves. Fazer um modelo em gesso, massa de modelar ou biscuit de três dessas pegadas."
        }
      ],
      "specialties": [
        "HM-031",
        "HM-055"
      ],
      "hierarchicalScale": null,
      "enabled": true
    },
    {
      "id": "U-40",
      "code": "U-40",
      "title": "Oficina de Especialidades Eletivas (Missão AM / Agrícolas AA / Saúde CS / Domésticas HD / Profissionais AP / Recreativas AR) + Códigos + Ensino pelo Guia",
      "fullTitle": "Oficina de Especialidades Eletivas (Missão AM / Agrícolas AA / Saúde CS / Domésticas HD / Profissionais AP / Recreativas AR) + Códigos + Ensino pelo Guia — *Unificado (9 em 1)*",
      "levelText": "🟣 Nível 3 + 🟡 Nível 4 (`SPECIALTY_ABSORPTION` / `SHARED_EVENT`)",
      "levels": [
        "N3",
        "N4"
      ],
      "ruleCode": "SPECIALTY_ABSORPTION",
      "scenario": "strict",
      "category": "ESPECIALIDADES",
      "systemRule": "Oficina de `AP-046 Código Semafórico` / `AM-014 Libras` / `AM-034 Braile` (com Guia ensinando 2 itens - GU VI.3) cumpre os códigos (PE-AV 10 / PI-AV 7) e as vagas eletivas das 6 classes.",
      "pedagogicalDetails": "Mesmo grupo de especialidades + ensino cruzado: ministrar especialidades eletivas como Código Semafórico (AP-046), Código Morse (AP-047), Língua de Sinais (AM-014) ou Braile (AM-034) com o auxílio instrutivo do Guia (VI.3 - ensinar 2 requisitos de uma especialidade) cumpre o envio/recebimento de mensagem em código de Pesquisador Av. 10 (ID 105) e as vagas eletivas de Amigo Av. 9, Companheiro Av. 12, Pesquisador Av. 11, Pioneiro IX.1 e Av. 8, Excursionista IX.1 e Guia IX.1.",
      "requirementsCount": 9,
      "requirementIds": [
        "AMIGO_AVANCADO_AV_9",
        "COMPANHEIRO_AVANCADO_AV_12",
        "PESQUISADOR_AVANCADO_AV_10",
        "PESQUISADOR_AVANCADO_AV_11",
        "PIONEIRO_IX_1",
        "PIONEIRO_AVANCADO_AV_8",
        "EXCURSIONISTA_IX_1",
        "GUIA_VI_3",
        "GUIA_IX_1"
      ],
      "requirementNums": [
        34,
        72,
        105,
        106,
        130,
        138,
        165,
        195,
        202
      ],
      "requirements": [
        {
          "num": 34,
          "id": "AMIGO_AVANCADO_AV_9",
          "code": "AV.9",
          "class_name": "Amigo da Natureza",
          "class_slug": "amigo-avancado",
          "section_info": "Classe Avançada (Req. 9)",
          "text": "Escolher e completar uma especialidade em uma das áreas abaixo: * a) Atividades missionárias * b) Atividades agrícolas"
        },
        {
          "num": 72,
          "id": "COMPANHEIRO_AVANCADO_AV_12",
          "code": "AV.12",
          "class_name": "Companheiro de Excursionismo",
          "class_slug": "companheiro-avancado",
          "section_info": "Classe Avançada (Req. 12)",
          "text": "Completar uma especialidade não realizada anteriormente: * a) Habilidades domésticas * b) Ciência e saúde * c) Atividades missionárias e comunitárias * d) Atividades agrícolas"
        },
        {
          "num": 105,
          "id": "PESQUISADOR_AVANCADO_AV_10",
          "code": "AV.10",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 10)",
          "text": "Enviar e receber uma mensagem através de uma das formas de comunicação abaixo: * a) Alfabeto com semáforos * b) Código Morse com lanterna * c) Alfabeto Libras (língua de sinais) * d) Alfabeto Braille"
        },
        {
          "num": 106,
          "id": "PESQUISADOR_AVANCADO_AV_11",
          "code": "AV.11",
          "class_name": "Pesquisador de Campo",
          "class_slug": "pesquisador-avancado",
          "section_info": "Classe Avançada (Req. 11)",
          "text": "Completar uma especialidade, não realizada anteriormente, em uma das áreas abaixo: * a) Habilidades domésticas * b) Ciência e saúde * c) Atividades missionárias * d) Atividades agrícolas"
        },
        {
          "num": 130,
          "id": "PIONEIRO_IX_1",
          "code": "IX.1",
          "class_name": "Pioneiro",
          "class_slug": "pioneiro",
          "section_info": "IX. Estilo de Vida (Req. 1)",
          "text": "Completar uma especialidade não realizada anteriormente em uma das seguintes áreas: * a) Atividades missionárias e comunitárias * b) Atividades profissionais * c) Atividades agrícolas e afins"
        },
        {
          "num": 138,
          "id": "PIONEIRO_AVANCADO_AV_8",
          "code": "AV.8",
          "class_name": "Pioneiro de Novas Fronteiras",
          "class_slug": "pioneiro-avancado",
          "section_info": "Classe Avançada (Req. 8)",
          "text": "Completar uma especialidade, não realizada anteriormente, em Atividades recreativas."
        },
        {
          "num": 165,
          "id": "EXCURSIONISTA_IX_1",
          "code": "IX.1",
          "class_name": "Excursionista",
          "class_slug": "excursionista",
          "section_info": "IX. Estilo de Vida (Req. 1)",
          "text": "Completar uma especialidade não realizada anteriormente em uma das seguintes áreas: * a) Atividades missionárias e comunitárias * b) Atividades agrícolas e afins * c) Ciência e saúde * d) Habilidades domésticas"
        },
        {
          "num": 195,
          "id": "GUIA_VI_3",
          "code": "VI.3",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "VI. Organização e Liderança (Req. 3)",
          "text": "Planejar e ensinar, no mínimo, dois requisitos de uma especialidade para um grupo ou Unidade de Desbravadores."
        },
        {
          "num": 202,
          "id": "GUIA_IX_1",
          "code": "IX.1",
          "class_name": "Guia",
          "class_slug": "guia",
          "section_info": "IX. Estilo de Vida (Req. 1)",
          "text": "Completar uma especialidade, não realizada anteriormente, em uma das seguintes áreas: * a) Atividades recreativas * b) Ciência e saúde * c) Habilidades domésticas * d) Atividades profissionais"
        }
      ],
      "specialties": [
        "AP-046",
        "AM-014",
        "AM-034",
        "AP-047"
      ],
      "hierarchicalScale": null,
      "enabled": true
    }
  ],
  "isolated": [
    {
      "num": 5,
      "id": "AMIGO_I_5",
      "code": "I.5",
      "className": "Amigo",
      "requirement": "I. Gerais (5)",
      "description": "Ler o livro *Vaso de Barro*.",
      "rule": "**100% Isolado:** Livro exclusivo da classe de Amigo (*Vaso de Barro*)."
    },
    {
      "num": 8,
      "id": "AMIGO_II_2",
      "code": "II.2",
      "className": "Amigo",
      "requirement": "II. Descoberta Espiritual (2)",
      "description": "Ler e explicar os versos abaixo: * a) João 3:16 * b) Efésios 6:1-3 * c) II Timóteo 3:16 * d)...",
      "rule": "**Conexão Parcial:** Contém **Salmo 1** (lido em Pesquisador II.3 `(ID 81)`), **João 3:16** (estudado em Nicodemos `(ID 82)` e lido em Excursionista `(ID 151)`) e **2 Tm 3:16** (lido em Guia `(ID 187)`)."
    },
    {
      "num": 9,
      "id": "AMIGO_II_3",
      "code": "II.3",
      "className": "Amigo",
      "requirement": "II. Descoberta Espiritual (3)",
      "description": "Leitura bíblica: * Gn 1, Gn 2, Gn 3, Gn 4:1-16, Gn 6:11-22, Gn 7, Gn 8, Gn 9:1-19, Gn 11:1-9...",
      "rule": "**Conexão Parcial:** Plano de leitura Gn–Êx. Seus capítulos cobrem **Criação** (`U-06`), **Dilúvio** (`U-06`), **José** (`(ID 27a)`), **10 Mandamentos** (`U-07`) e **Santuário** (`(ID 185)`)."
    },
    {
      "num": 18,
      "id": "AMIGO_VII_1",
      "code": "VII.1",
      "className": "Amigo",
      "requirement": "VII. Estudo da Natureza (1)",
      "description": "Completar uma das seguintes especialidades: * a) Felinos * b) Cães * c) Mamíferos * d) Semen...",
      "rule": "**Conexão no Cenário 2:** Especialidade de Natureza de Amigo (*Felinos, Cães, Mamíferos, Sementes, Aves de Estimação*). Pode ser cursada junto por Pioneiro (`(ID 126)`) ou Excursionista (`(ID 162)`) na vaga livre de Natureza."
    },
    {
      "num": 19,
      "id": "AMIGO_VII_2",
      "code": "VII.2",
      "className": "Amigo",
      "requirement": "VII. Estudo da Natureza (2)",
      "description": "Aprender e demonstrar uma maneira para purificar a água e escrever um parágrafo destacando o...",
      "rule": "**Conexão no Cenário 2:** Purificar água é requisito prático interno das especialidades *Acampamento II* (`AR-051`), *Excursionismo com Mochila* (`AR-056`) e *Vida Silvestre* (`AR-024`) em `U-38`."
    },
    {
      "num": 27,
      "id": "AMIGO_AVANCADO_AV_2",
      "code": "AV.2",
      "className": "Amigo da Natureza",
      "requirement": "Classe Avançada (2)",
      "description": "Em consulta com seu líder, escolher um dos seguintes personagens do Antigo Testamento e conv...",
      "rule": "**Conexão no Cenário 2:** Estudo de José, Jonas, Ester ou Rute. Conecta-se 100% à leitura bíblica de Gn 37–50 (`(ID 9)`), Rute 1–4 (`(ID 43)`), Ester 1–8 (`(ID 81)`) ou Jonas 1–4 (`(ID 117)`)."
    },
    {
      "num": 39,
      "id": "COMPANHEIRO_I_5",
      "code": "I.5",
      "className": "Companheiro",
      "requirement": "I. Gerais (5)",
      "description": "Ler o livro *Um simples lanche*.",
      "rule": "**100% Isolado:** Livro exclusivo da classe de Companheiro (*Um simples lanche*)."
    },
    {
      "num": 42,
      "id": "COMPANHEIRO_II_2",
      "code": "II.2",
      "className": "Companheiro",
      "requirement": "II. Descoberta Espiritual (2)",
      "description": "Ler e explicar os versos abaixo: * a) Isaías 41:9-10 * b) Hebreus 13:5 * c) Provérbios 22:6 ...",
      "rule": "**100% Isolado:** Lista de 5 versos exclusivos de Companheiro II.2 (Is 41:9-10; Hb 13:5; Pv 22:6; 1 Jo 1:9; Sl 8)."
    },
    {
      "num": 43,
      "id": "COMPANHEIRO_II_3",
      "code": "II.3",
      "className": "Companheiro",
      "requirement": "II. Descoberta Espiritual (3)",
      "description": "Leitura bíblica: * Lv 11, Nm 9:15-23, 11, 12, 13, 14:1-38, 16, 17, 20:1-13; 22-29, 21:4-9, 2...",
      "rule": "**Conexão Parcial:** Plano de leitura Lv–2Sm. Inclui integralmente **Levítico 11** (`(ID 79)`), **Rute 1–4** (`(ID 27d)`) e **1 Samuel 15** (`(ID 113g)`)."
    },
    {
      "num": 52,
      "id": "COMPANHEIRO_VI_1",
      "code": "VI.1",
      "className": "Companheiro",
      "requirement": "VI. Organização e Liderança (1)",
      "description": "Dirigir ou colaborar em uma meditação criativa para sua Unidade ou Clube.",
      "rule": "**Conexão no Cenário 2:** Dirigir meditação criativa une-se à cerimônia de abertura dirigida por Pesquisador (`(ID 88)`) e à apresentação de Guia (`(ID 196)`)."
    },
    {
      "num": 77,
      "id": "PESQUISADOR_I_5",
      "code": "I.5",
      "className": "Pesquisador",
      "requirement": "I. Gerais (5)",
      "description": "Ler o livro *Além da magia*.",
      "rule": "**100% Isolado:** Livro exclusivo da classe de Pesquisador (*Além da magia*)."
    },
    {
      "num": 79,
      "id": "PESQUISADOR_II_1",
      "code": "II.1",
      "className": "Pesquisador",
      "requirement": "II. Descoberta Espiritual (1)",
      "description": "Memorizar e demonstrar o seu conhecimento: * a) **Levítico 11:** regras dos alimentos consid...",
      "rule": "**Conexão no Cenário 2:** Regras dos alimentos de **Levítico 11**. Une-se diretamente à leitura de Lv 11 (`(ID 43)`) e à oficina de Dieta Saudável / Nutrição (`U-25`)."
    },
    {
      "num": 80,
      "id": "PESQUISADOR_II_2",
      "code": "II.2",
      "className": "Pesquisador",
      "requirement": "II. Descoberta Espiritual (2)",
      "description": "Ler e explicar os versos abaixo: * a) Eclesiastes 12:13-14 * b) Romanos 6:23 * c) Apocalipse...",
      "rule": "**Conexão Parcial:** Contém **Ec 12:13-14** e **Is 43:1-2** (lidos em Pioneiro II.6 `(ID 117)`) e **Ap 1:3** (lido em Guia II.6 `(ID 187)`)."
    },
    {
      "num": 81,
      "id": "PESQUISADOR_II_3",
      "code": "II.3",
      "className": "Pesquisador",
      "requirement": "II. Descoberta Espiritual (3)",
      "description": "Leitura bíblica: * 1 Rs 1:28-53, 3, 4:20-34, 5, 6, 8:12-60, 10, 11:6-43, 12, 16:29-33, 17:1-...",
      "rule": "**Conexão Parcial:** Plano de leitura 1Rs–Ec 1. Inclui **Ester 1–8** (`(ID 27c)`), **Salmo 1** (`(ID 8d)`), **Salmo 23** (`(ID 113f)` e Braille `(ID 137e)`) e **Salmo 46** (`(ID 147f)`)."
    },
    {
      "num": 88,
      "id": "PESQUISADOR_VI_1",
      "code": "VI.1",
      "className": "Pesquisador",
      "requirement": "VI. Organização e Liderança (1)",
      "description": "Dirigir uma cerimônia de abertura da reunião semanal do seu Clube ou um programa da Escola S...",
      "rule": "**Conexão no Cenário 2:** Dirigir cerimônia de abertura do Clube/Escola Sabatina une-se à meditação criativa de Companheiro (`(ID 52)`)."
    },
    {
      "num": 109,
      "id": "PIONEIRO_I_3",
      "code": "I.3",
      "className": "Pioneiro",
      "requirement": "I. Gerais (3)",
      "description": "Memorizar e entender o Alvo e o Lema JA.",
      "rule": "**100% Isolado (ou Agrupado em Ideais JA):** Memorizar e entender o Alvo e o Lema JA."
    },
    {
      "num": 111,
      "id": "PIONEIRO_I_5",
      "code": "I.5",
      "className": "Pioneiro",
      "requirement": "I. Gerais (5)",
      "description": "Ler o livro *Expedição Galápagos*.",
      "rule": "**100% Isolado:** Livro exclusivo da classe de Pioneiro (*Expedição Galápagos*)."
    },
    {
      "num": 113,
      "id": "PIONEIRO_II_2",
      "code": "II.2",
      "className": "Pioneiro",
      "requirement": "II. Descoberta Espiritual (2)",
      "description": "Ler e explicar os versos abaixo: * a) Isaías 26:3 * b) Romanos 12:12 * c) João 14:1-3 * d) S...",
      "rule": "**Conexão Parcial:** Contém **Is 26:3** (lido na própria classe `(ID 117)`), **Salmo 23** (lido em `(ID 81)` e transcrito em Braille em `(ID 137e)`), **Jo 14:1-3** (lido em `(ID 151)`), **Rm 12:12** (lido em `(ID 187)`) e **1 Sm 15:22** (lido em `(ID 43)`)."
    },
    {
      "num": 114,
      "id": "PIONEIRO_II_3",
      "code": "II.3",
      "className": "Pioneiro",
      "requirement": "II. Descoberta Espiritual (3)",
      "description": "Conversar em seu Clube ou Unidade sobre: * a) O que é o cristianismo * b) Quais são as carac...",
      "rule": "**Conexão no Cenário 2:** Conversar sobre o que é cristianismo e verdadeiro discípulo (une-se à especialidade `AM-EB-010 Experiência da Salvação` / `AM-EB-011 Crescimento em Cristo`)."
    },
    {
      "num": 115,
      "id": "PIONEIRO_II_4",
      "code": "II.4",
      "className": "Pioneiro",
      "requirement": "II. Descoberta Espiritual (4)",
      "description": "Participar de um estudo especial sobre a inspiração da Bíblia, com a ajuda de um pastor, tra...",
      "rule": "**Conexão no Cenário 2:** Estudo especial sobre inspiração, revelação e iluminação da Bíblia com pastor (une-se à especialidade `AM-EB-001 Escrituras Sagradas`)."
    },
    {
      "num": 117,
      "id": "PIONEIRO_II_6",
      "code": "II.6",
      "className": "Pioneiro",
      "requirement": "II. Descoberta Espiritual (6)",
      "description": "Leitura bíblica: * Ec 3, 5, 7, 11 e 12. * Is 5, 11, 26:1-12, 35, 40, 43, 52:13-15, 53, 58, 6...",
      "rule": "**Conexão Parcial:** Plano de leitura Ec 3–Mt 23. Inclui **Ec 12** e **Is 43** (`(ID 80)`), **Is 26** (`(ID 113a)`), **Daniel 1** (`U-23`), **Jonas 1–4** (`(ID 27b)`) e **Mateus 5–7 / Sermão do Monte** (`U-08`)."
    },
    {
      "num": 143,
      "id": "EXCURSIONISTA_I_3",
      "code": "I.3",
      "className": "Excursionista",
      "requirement": "I. Gerais (3)",
      "description": "Memorizar e explicar o significado do Objetivo JA.",
      "rule": "**100% Isolado (ou Agrupado em Ideais JA):** Memorizar e explicar o significado do Objetivo JA."
    },
    {
      "num": 145,
      "id": "EXCURSIONISTA_I_5",
      "code": "I.5",
      "className": "Excursionista",
      "requirement": "I. Gerais (5)",
      "description": "Ler o livro *O fim do começo*.",
      "rule": "**100% Isolado:** Livro exclusivo da classe de Excursionista (*O fim do começo*)."
    },
    {
      "num": 147,
      "id": "EXCURSIONISTA_II_2",
      "code": "II.2",
      "className": "Excursionista",
      "requirement": "II. Descoberta Espiritual (2)",
      "description": "Ler e explicar os versos abaixo: * a) Romanos 8:28 * b) Apocalipse 21:1-3 * c) II Pedro 1:20...",
      "rule": "**Conexão Parcial:** Contém **Salmo 46** (lido em `(ID 81)`), **Ap 21:1-3** (Nova Jerusalém em `U-11` e lido em `(ID 187)`) e **1 Jo 2:14** (lido em `(ID 187)`)."
    },
    {
      "num": 151,
      "id": "EXCURSIONISTA_II_6",
      "code": "II.6",
      "className": "Excursionista",
      "requirement": "II. Descoberta Espiritual (6)",
      "description": "Leitura bíblica: * Mt 24, 25, 26:1-35, 26:36-75, 27:1-31, 27:32-56, 27:57-66, 28. * Mc 7, 9,...",
      "rule": "**Conexão Parcial:** Plano de leitura Mt 24–At 8. Inclui **Mateus 24** (`U-11` e Libras `(ID 137d)`), **Lucas 10, 15, 19 e João 3–4** (`U-09` e `U-16`) e **João 14** (`(ID 113c)`)."
    },
    {
      "num": 179,
      "id": "GUIA_I_3",
      "code": "I.3",
      "className": "Guia",
      "requirement": "I. Gerais (3)",
      "description": "Memorizar e explicar o Voto de Fidelidade à Bíblia.",
      "rule": "**100% Isolado (ou Agrupado em Ideais JA):** Memorizar e explicar o Voto de Fidelidade à Bíblia."
    },
    {
      "num": 181,
      "id": "GUIA_I_5",
      "code": "I.5",
      "className": "Guia",
      "requirement": "I. Gerais (5)",
      "description": "Ler o livro *O livro amargo*.",
      "rule": "**100% Isolado:** Livro exclusivo da classe de Guia (*O livro amargo*)."
    },
    {
      "num": 183,
      "id": "GUIA_II_2",
      "code": "II.2",
      "className": "Guia",
      "requirement": "II. Descoberta Espiritual (2)",
      "description": "Ler e explicar os versos abaixo: * a) I Coríntios 13 * b) II Crônicas 7:14 * c) Apocalipse 2...",
      "rule": "**Conexão no Cenário 2:** Contém **1 Coríntios 13** (lido na própria classe `(ID 187)`), **Mateus 6:33-34** (Sermão da Montanha `U-08`) e **Ap 22:18-20**."
    },
    {
      "num": 184,
      "id": "GUIA_II_3",
      "code": "II.3",
      "className": "Guia",
      "requirement": "II. Descoberta Espiritual (3)",
      "description": "Descrever os dons espirituais mencionados nos escritos de Paulo (Coríntios, Efésios, Filipen...",
      "rule": "**Conexão no Cenário 2:** Descrever os dons espirituais em Coríntios, Efésios e Filipenses (capítulos já lidos em `(ID 187)` + especialidade `AM-EB-017 Dons e Ministérios Espirituais`)."
    },
    {
      "num": 185,
      "id": "GUIA_II_4",
      "code": "II.4",
      "className": "Guia",
      "requirement": "II. Descoberta Espiritual (4)",
      "description": "Estudar a estrutura e serviço do santuário no Antigo Testamento e relacionar com o ministéri...",
      "rule": "**Conexão no Cenário 2:** Estrutura e serviço do Santuário no AT (une-se à leitura de Êx 35 e 40 em `(ID 9)` e às especialidades `AM-023 Santuário` e `AM-EB-024`)."
    },
    {
      "num": 187,
      "id": "GUIA_II_6",
      "code": "II.6",
      "className": "Guia",
      "requirement": "II. Descoberta Espiritual (6)",
      "description": "Leitura bíblica: * At 9:1-31, 9:32-43, 10, 11, 12, 13, 14, 16, 17:1-15, 17:16-34, 18, 19:1-2...",
      "rule": "**Conexão Parcial:** Plano de leitura At 9–Ap 21. Engloba **Rm 12** (`(ID 113b)`), **1 Co 12–13 e Ef 5–6** (`(ID 183a)` e `(ID 184)`), **2 Tm 3** (`(ID 8c)`), **1 Jo 2** (`(ID 147d)`) e **Ap 1–3, 14, 19–21** (`U-11` e `(ID 147b)`)."
    },
    {
      "num": 194,
      "id": "GUIA_VI_2",
      "code": "VI.2",
      "className": "Guia",
      "requirement": "VI. Organização e Liderança (2)",
      "description": "Participar em um dos itens abaixo: * a) Curso para conselheiros * b) Convenção de liderança ...",
      "rule": "**100% Isolado:** Participar de Curso para Conselheiros, Convenção de Liderança da Associação/Missão ou 2 reuniões de diretoria do Clube."
    },
    {
      "num": 196,
      "id": "GUIA_VII_1",
      "code": "VII.1",
      "className": "Guia",
      "requirement": "VII. Estudo da Natureza (1)",
      "description": "Ler o capítulo 7 do livro *O Desejado de Todas as Nações* sobre a infância de Jesus. Apresen...",
      "rule": "**Conexão no Cenário 2:** Ler cap. 7 de *O Desejado de Todas as Nações* sobre a infância de Jesus e a natureza e apresentar ao Clube/Unidade (pode ser a meditação de abertura de `(ID 52)`/`(ID 88)`)."
    },
    {
      "num": 197,
      "id": "GUIA_VII_2",
      "code": "VII.2",
      "className": "Guia",
      "requirement": "VII. Estudo da Natureza (2)",
      "description": "Completar uma das seguintes especialidades: * a) Ecologia * b) Conservação ambiental",
      "rule": "**Conexão no Cenário 2:** Especialidade de *Ecologia* (`EN-044`) ou *Conservação Ambiental* (`EN-046`). Pode ser cursada junto por Pioneiro (`(ID 126)`) e Excursionista (`(ID 162)`) na vaga livre de Estudo da Natureza."
    },
    {
      "num": 207,
      "id": "GUIA_AVANCADO_AV_5",
      "code": "AV.5",
      "className": "Guia de Exploração",
      "requirement": "Classe Avançada (5)",
      "description": "Observar durante o período de dois meses o trabalho dos diáconos, apresentando um relatório ...",
      "rule": "**100% Isolado (com interseção em Dízimos):** Observar por 2 meses o trabalho dos diáconos (propriedade, lava-pés, batismo e recolhimento de dízimos e ofertas)."
    }
  ],
  "biblePairs": [
    {
      "theme": "**AM II.1a** — Criação (o que Deus criou em cada dia)",
      "bibleChapter": "**AM II.3** (`Gn 1 e 2`) + **CO VII.3** (Diário de 7 dias)",
      "connectionType": "🟢 N1 (Mesma classe + CO)"
    },
    {
      "theme": "**AM II.1b** — 10 Pragas do Egito",
      "bibleChapter": "**AM II.3** (`Êx 7, 8, 9, 10, 11 e 12`)",
      "connectionType": "🟢 N1 (Mesma classe AM)"
    },
    {
      "theme": "**AM-AV 2a/b/c/d** — José, Rute, Ester ou Jonas",
      "bibleChapter": "**AM II.3** (`Gn 37–50`), **CO II.3** (`Rt 1–4`), **PE II.3** (`Et 1–8`), **PI II.6** (`Jn 1–4`)",
      "connectionType": "🟢 N1 (Intra e Inter-classes)"
    },
    {
      "theme": "**AM II.2a** — João 3:16",
      "bibleChapter": "**EX II.6** (`Jo 3`) + **PE II.4a** e **EX VII.1** (Nicodemos)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**AM II.2b** — Efésios 6:1-3 (Honrar pai e mãe)",
      "bibleChapter": "**GU II.6** (`Ef 6`) + 🟠 **CO II.1a** (5º Mandamento) e **CO-AV 4 / GU IV.1b**",
      "connectionType": "🟢 N1 / 🟠 N4"
    },
    {
      "theme": "**AM II.2c** — II Timóteo 3:16 (Inspiração da Bíblia)",
      "bibleChapter": "**GU II.6** (`2 Tm 3`) + 🟠 **PI II.4** (Inspiração da Bíblia)",
      "connectionType": "🟢 N1 / 🟠 N4"
    },
    {
      "theme": "**AM II.2d** — Salmo 1",
      "bibleChapter": "**PE II.3** (`Sl 1`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**AM IV.1** — Mateus 7:12 (Regra Áurea)",
      "bibleChapter": "**PI II.6** (`Mt 7` — dentro do Sermão da Montanha)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**AM V.2a/b** — Daniel 1 e Daniel 1:8",
      "bibleChapter": "**PI II.6** (`Dn 1`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**CO II.1a** — Os 10 Mandamentos",
      "bibleChapter": "**AM II.3** (`Êx 20`) + **EX-AV 1** (Respeito à Lei de Deus)",
      "connectionType": "🟢 N1 / 🟡 N3"
    },
    {
      "theme": "**PE II.1a** — Levítico 11 (Alimentos limpos e imundos)",
      "bibleChapter": "**CO II.3** (`Lv 11`) + 🟠 **AM V.3 / PE-AV 9** (Dieta e Cardápio Vegetariano)",
      "connectionType": "🟢 N1 / 🟠 N4"
    },
    {
      "theme": "**PE II.2a** — Eclesiastes 12:13-14",
      "bibleChapter": "**PI II.6** (`Ec 12`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**PE II.2c** — Apocalipse 1:3",
      "bibleChapter": "**GU II.6** (`Ap 1`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**PE II.2d** — Isaías 43:1-2",
      "bibleChapter": "**PI II.6** (`Is 43`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**PE II.4a/b/c/d/e** — 5 Histórias de Jesus (Jo 3, Jo 4, Lc 10, Lc 15, Lc 19)",
      "bibleChapter": "**EX II.6** (`Jo 3, Jo 4, Lc 10, Lc 15, Lc 19`) + **CO II.4a** (Parábola) + **PI-AV 2** (Bom Samaritano) + 🟠 **AM VII.2** (Jo 4 / Água da Vida)",
      "connectionType": "🟢 N1 / 🟡 N3"
    },
    {
      "theme": "**PE-AV 2** — Grande Comissão (Mateus 28:18-20)",
      "bibleChapter": "**EX II.6** (`Mt 28`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**PI II.2a** — Isaías 26:3",
      "bibleChapter": "**PI II.6** (`Is 26:1-12`)",
      "connectionType": "🟢 N1 (Mesma classe PI)"
    },
    {
      "theme": "**PI II.2b** — Romanos 12:12",
      "bibleChapter": "**GU II.6** (`Rm 12`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**PI II.2c** — João 14:1-3",
      "bibleChapter": "**EX II.6** (`Jo 14`) + **EX II.4** (Segunda Vinda)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**PI II.2d** — Salmo 37:5",
      "bibleChapter": "**PE II.3** (`Sl 37`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**PI II.2f** — Salmo 23",
      "bibleChapter": "**PE II.3** (`Sl 23`) + **PI-AV 7e** (Salmo 23 em Braille)",
      "connectionType": "🟢 N1 (Intra e Inter-classes)"
    },
    {
      "theme": "**PI II.2g** — I Samuel 15:22",
      "bibleChapter": "**CO II.3** (`1 Sm 15`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**EX II.1b** — Fruto do Espírito",
      "bibleChapter": "**GU II.6** (`Gl 5:16-26`) + **EX II.3** (Pessoa do Espírito Santo)",
      "connectionType": "🟢 N1 / 🟡 N3"
    },
    {
      "theme": "**EX II.2b** — Apocalipse 21:1-3",
      "bibleChapter": "**GU II.6** (`Ap 21`) + **GU II.1c** (Nova Jerusalém)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**EX II.2d** — I João 2:14",
      "bibleChapter": "**GU II.6** (`1 Jo 2`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**EX II.2f** — Salmo 46",
      "bibleChapter": "**PE II.3** (`Sl 46`)",
      "connectionType": "🟢 N1"
    },
    {
      "theme": "**GU II.1a/b/c, II.2a e II.3** — Apocalipse 2–3, 14, 21; 1 Co 13 e Dons em Coríntios/Efésios",
      "bibleChapter": "**GU II.6** (`1 Co 12–13, Ef 5–6, Ap 1–3, 14, 21`)",
      "connectionType": "🟢 N1 (Mesma classe GU)"
    },
    {
      "theme": "**GU II.2f** — Mateus 6:33-34",
      "bibleChapter": "**PI II.6** (`Mt 6`) + **GU-AV 2** (*O Maior Discurso de Cristo*)",
      "connectionType": "🟢 N1"
    }
  ],
  "anchorEvents": [
    {
      "order": 1,
      "code": "E1",
      "title": "Expedição de 20 km com Pernoite, Pioneiria e Cozinha ao Ar Livre",
      "body": "* *Caminhada Escalonada (`U-34`):* 5 km (`AM VI.1`), 6 km (`CO-AV 5`), 10 km (`PE-AV 5`, `PI-AV 3a`) e 20 km com pernoite (`EX VIII.1`), com lista de equipamentos, regras de caminhada (`AM VIII.3`), técnicas de trilhas (`EX-AV 9`) e *Excursionismo Pedestre com Mochila* (`AR-056`, `CO-AV 11`).\n   * *Acampamento, Barraca e Abrigos (`U-38`):* Planejamento e pernoite (`CO VI.2`, `CO VIII.2`, `PE VIII.1`, `PI VIII.2`, `GU VIII.1`), armar barraca (`AM VII.3`) e 3 abrigos (`GU-AV 7`).\n   * *Fogueiras e Refeições (`U-37`):* Cardápio vegetariano de 3 dias (`PE-AV 9`), 1 refeição (`CO-AV 9`), 2 refeições (`PE VIII.1`) e 3 refeições (`GU VIII.2`), fogo natural (`AM-AV 7`), refletor (`PI VIII.1`), na chuva (`PI-AV 6`), faca/machadinha (`AM-AV 8`, `PI-AV 5`) e *Fogueiras e Cozinha ao Ar Livre* (`AR-020`, `PI-AV 10`).\n   * *Orientação e Natureza (`U-32`, `U-33`, `U-35`):* Pista de 10 sinais (`AM VIII.4`), Rosa dos Ventos sem bússola (`CO VIII.1`), GPS/bússola (`PE VIII.3`), *Mapa e Bússola* (`PI-AV 4`) e identificação botânica/zoológica em trilha."
    },
    {
      "order": 2,
      "code": "E2",
      "title": "Diagnóstico Cívico + Projeto Comunitário Ecológico e Inclusivo Planejado pelos Alunos",
      "body": "* Visita prévia ao órgão público (`PE IV.2`) → gera o projeto comunitário planejado e executado (`EX III.2`, `CO III.2`, `PE III.1`, `PI III.2`, `AM III.1c`, `GU III.1c`) + atividade recreativa inclusiva (`EX IV.2`, `U-18`) + prática de *Ecologia/Conservação Ambiental* (`GU VII.2`)."
    },
    {
      "order": 3,
      "code": "E3",
      "title": "Ação \"Bom Samaritano\" de Visita e Auxílio a Famílias Carentes/Doentes",
      "body": "* Encenação e auxílio prático a 3+ pessoas (`PI-AV 2`), 2h de serviço comunitário levando amigo e alimento/oração (`AM III.1a/b`, `CO III.1`, `CO-AV 3`, `GU III.1a/b`) e visita missionária com pastor/ancião (`EX-AV 2`)."
    },
    {
      "order": 4,
      "code": "E4",
      "title": "Semana de Saúde, Nutrição, Cultura Física e Temperança",
      "body": "* Especialidade de *Temperança* (`AM-013`, `EX V.1`), Daniel 1 (`AM V.2`), prevenção a fumo/álcool/drogas e Compromisso Pessoal de Vida Saudável em 4 seções (`CO V.3`, `CO-AV 6`, `PE V.1`, `GU V.2a/c`, `GU-AV 8d`), 8 Remédios Naturais (`GU V.1`, `PI V.2`), grupos de alimentos (`AM V.3`) e *Cultura Física* liderada pelo Guia (`GU V.2d`, `AM V.1b`, `CO V.1/V.2`, `PI V.1`)."
    },
    {
      "order": 5,
      "code": "E5",
      "title": "Cerimônia Especial (Admissão em Lenço / Investidura / Dia Mundial DBV) + Civismo",
      "body": "* Organização por Pesquisador (`PE-AV 6`) e participação/ideias por Companheiro (`CO-AV 8`), precedida pela oficina de Hino Nacional (`AM IV.2`), Hino DBV (`AM-AV 1`), Bandeira Nacional (`CO-AV 1`), Bandeira DBV/Bandeirim (`PE-AV 1`) e *Ordem Unida* (`AR-047`, `EX-AV 10`)."
    },
    {
      "order": 6,
      "code": "E6",
      "title": "Dia do Amigo Desbravador (Convite para Classe Bíblica / Pequeno Grupo / Clube / Igreja)",
      "body": "* Palestra/texto de como influenciar amigos (`GU-AV 4`) e recepção de convidados cumprindo `AM-AV 3`, `PE-AV 3`, `PI II.5`, `EX III.1` e `GU-AV 3a`."
    },
    {
      "order": 7,
      "code": "E7",
      "title": "Domingo de Pioneirias, Nós, Amarras e Socorrismo (Com Guia como Instrutor)",
      "body": "* O Guia ensina requisitos (`GU VI.3`); oficina dos 14 nós (`AM VIII.1`), 9 nós (`CO VIII.3`), quadro de 15 nós (`CO-AV 10`), 4 amarras básicas + móvel em tamanho real + portal (`PE-AV 8`, `EX VIII.2`, `EX-AV 5`, `GU VIII.3`) + *Primeiros Socorros Básico*, *Resgate Básico* e animais peçonhentos (`PE VIII.2b`, `PI VIII.3`, `EX-AV 8`)."
    },
    {
      "order": 8,
      "code": "E8",
      "title": "Super Oficina de Especialidades Eletivas e Comunicação Inclusiva (Libras, Braille, Semáforo, Gesso/Biscuit)",
      "body": "* Oficinas de *Modelagem em Gesso/Biscuit* (`HM-031`/`055` para `AM/CO/PE IX.1` + moldes de pegadas `PE-AV 7`) e *Código Semafórico / Libras / Braile* (`AP-046`, `AM-014`, `AM-034` para `PE-AV 10`, `PI-AV 7b–e` e vagas eletivas de `AM-AV 9`, `CO-AV 12`, `PE-AV 11`, `PI IX.1`, `EX IX.1`, `GU IX.1`)."
    },
    {
      "order": 9,
      "code": "E9",
      "title": "Ciclo de Rodas de Conversa (Amizade, Pais e Sexualidade) e Estudos Bíblicos Temáticos",
      "body": "* Roda 1: Autoestima, Amizade e Pressão de Grupo (`PE IV.1`, `PI IV.1a/b`, `EX IV.1a/d`).\n   * Roda 2: Respeito e Relacionamento com os Pais (`CO-AV 4`, `EX IV.1b`, `GU IV.1b`, `PE-AV 4b`).\n   * Roda 3 (15 anos): Escolha profissional, Namoro, Plano de Deus para o Sexo e ISTs (`GU IV.1a/c/d` + `GU-AV 8e`)."
    }
  ],
  "strategicSpecialties": [
    {
      "code": "HM-031",
      "name": "Modelagem em Gesso",
      "area": "HM",
      "unifies": "Artes Manuais (AM/CO/PE IX.1) + 3 moldes de pegadas (PE-AV 7)"
    },
    {
      "code": "HM-055",
      "name": "Biscuit",
      "area": "HM",
      "unifies": "Artes Manuais (AM/CO/PE IX.1) + 3 moldes de pegadas (PE-AV 7)"
    },
    {
      "code": "HM-007",
      "name": "Letreiros e Cartazes",
      "area": "HM",
      "unifies": "Artes Manuais (AM/CO/PE IX.1) + Cartaz drogas (CO-AV 6c) + Série cartazes salvação (PE II.4c)"
    },
    {
      "code": "AP-046",
      "name": "Código Semafórico",
      "area": "AP",
      "unifies": "Atividades Profissionais (PI IX.1b, GU IX.1d) + Código (PE-AV 10) + 35 letras/min (PI-AV 7b)"
    },
    {
      "code": "AP-047",
      "name": "Código Morse",
      "area": "AP",
      "unifies": "Atividades Profissionais (PI IX.1b, GU IX.1d) + Código Morse lanterna (PE-AV 10b)"
    },
    {
      "code": "AM-014",
      "name": "Língua de Sinais",
      "area": "AM",
      "unifies": "Eletiva Missionárias (AM-AV 9a, CO-AV 12c, PE-AV 11c, PI IX.1a, EX IX.1a) + Libras (PE-AV 10c, PI-AV 7d)"
    },
    {
      "code": "AM-034",
      "name": "Braile",
      "area": "AM",
      "unifies": "Eletiva Missionárias + Salmo 23 em Braille (PI-AV 7e) + Alfabeto Braille (PE-AV 10d)"
    },
    {
      "code": "EN-043",
      "name": "Plantas Silvestres Comestíveis",
      "area": "EN",
      "unifies": "Estudo da Natureza livre (PI VII.2, EX VII.2) + 10 plantas comestíveis (PI-AV 7a) + Plantas silvestres vs tóxicas (EX-AV 7)"
    },
    {
      "code": "EN-017",
      "name": "Fósseis",
      "area": "EN",
      "unifies": "Estudo da Natureza (PI VII.2) + Dilúvio e fossilização (PI VII.1)"
    },
    {
      "code": "EN-008",
      "name": "Mariposas e Borboletas",
      "area": "EN",
      "unifies": "Estudo da Natureza (EX VII.2) + Nicodemos e metamorfose (EX VII.1) + 25 borboletas/mariposas (PI-AV 9d)"
    },
    {
      "code": "EN-069",
      "name": "Animais Peçonhentos",
      "area": "EN",
      "unifies": "Estudo da Natureza (EX VII.2) + Procedimentos em ferimentos por animais peçonhentos (EX-AV 8)"
    },
    {
      "code": "CS-040",
      "name": "Remédios da Natureza",
      "area": "CS",
      "unifies": "Eletiva Ciência e Saúde (CO-AV 12b, PE-AV 11b, EX IX.1c, GU IX.1b) + 8 Remédios (GU V.1) + Estilo de vida (PI V.2)"
    },
    {
      "code": "CS-008",
      "name": "Nutrição",
      "area": "CS",
      "unifies": "Eletiva Saúde ou GU V.2d + Princípios dieta saudável (AM V.3) + Cardápio vegetariano 3 dias (PE-AV 9)"
    },
    {
      "code": "AM-043",
      "name": "Pioneiros Adventistas",
      "area": "AM",
      "unifies": "Eletiva Missionárias + J. N. Andrews (PE-AV 2) + 3 histórias de pioneiros (GU II.5)"
    },
    {
      "code": "AM-023",
      "name": "Santuário",
      "area": "AM",
      "unifies": "Eletiva Missionárias + Serviço do Santuário no AT (GU II.4)"
    }
  ]
};

export default unificationsCatalog;
