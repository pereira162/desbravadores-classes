#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera o catálogo estruturado em JSON de todos os Cartões de Classes dos Desbravadores
(Classes Regulares e Classes Avançadas: Amigo a Guia) a partir dos dados oficiais da DSA,
categorizando cada atividade por seção, categoria temática, local/contexto, tags de filtro
e grupos de equivalência inter-classes.
"""

import json
import os

BASE_DIR = "/config/Documentos/Projetos/desbravadores/gestao-classes"
DATA_DIR = os.path.join(BASE_DIR, "data")
MD_DIR = os.path.join(DATA_DIR, "cartoes-oficiais", "markdown")
os.makedirs(MD_DIR, exist_ok=True)

# Definição de Categorias, Locais/Contextos e Grupos de Equivalência para o Filtro Dinâmico
CATEGORIES_CATALOG = [
    {"id": "IDEAIS_E_LEITURA", "name": "Ideais, Livros e Gerais", "icon": "BookOpen"},
    {"id": "ESPIRITUAL_E_BIBLIA", "name": "Descoberta Espiritual e Bíblia", "icon": "BookMarked"},
    {"id": "COMUNIDADE_E_MISSAO", "name": "Comunidade, Serviço e Missão", "icon": "HeartHandshake"},
    {"id": "AMIZADE_E_CIDADANIA", "name": "Amizade, Civismo e Relacionamentos", "icon": "Users"},
    {"id": "SAUDE_E_APTIDAO", "name": "Saúde, Temperança e Aptidão Física", "icon": "Activity"},
    {"id": "LIDERANCA_E_IGREJA", "name": "Organização, Liderança e Igreja", "icon": "Award"},
    {"id": "NATUREZA_E_ECOLOGIA", "name": "Estudo da Natureza e Meio Ambiente", "icon": "Trees"},
    {"id": "ACAMPAMENTO_E_PIONEIRIA", "name": "Arte de Acampar, Nós e Pioneiria", "icon": "Tent"},
    {"id": "CAMINHADA_E_ORIENTACAO", "name": "Caminhada, Excursionismo e Orientação", "icon": "Compass"},
    {"id": "ESPECIALIDADES", "name": "Especialidades (Mestrados e Áreas)", "icon": "ShieldCheck"}
]

CONTEXT_TAGS_CATALOG = [
    {"id": "reuniao_clube", "label": "Reunião Regular / Sede", "group": "local"},
    {"id": "ar_livre", "label": "Ao Ar Livre / Campo", "group": "local"},
    {"id": "acampamento", "label": "Acampamento / Pernoite", "group": "local"},
    {"id": "igreja", "label": "Na Igreja / Culto / Escola Sabatina", "group": "local"},
    {"id": "comunidade", "label": "Na Comunidade / Visita Externa", "group": "local"},
    {"id": "em_casa", "label": "Em Casa / Individual", "group": "local"},
    {"id": "especialidade", "label": "Especialidade", "group": "formato"},
    {"id": "caminhada", "label": "Caminhada / Trilha", "group": "formato"},
    {"id": "nos_e_amarras", "label": "Nós, Amarras e Pioneiria", "group": "formato"},
    {"id": "fogueira_cozinha", "label": "Fogueira e Cozinha Mateira", "group": "formato"},
    {"id": "orientacao_bussola", "label": "Bússola, Mapa, Pistas e Sinais", "group": "formato"},
    {"id": "leitura", "label": "Leitura de Livro / Ano Bíblico", "group": "formato"},
    {"id": "memorizacao", "label": "Memorização / Ideais / Versos", "group": "formato"},
    {"id": "debate_apresentacao", "label": "Debate / Palestra / Encenação", "group": "formato"},
    {"id": "primeiros_socorros", "label": "Primeiros Socorros / Resgate / Segurança", "group": "formato"},
    {"id": "civismo_ordem_unida", "label": "Civismo / Bandeiras / Ordem Unida", "group": "formato"}
]

EQUIVALENCE_GROUPS = [
    {
        "id": "EQ-MEMBRO-ATIVO",
        "title": "Membro Ativo e Frequência no Clube",
        "description": "Ser membro ativo e regular do Clube de Desbravadores durante o ano de atividades."
    },
    {
        "id": "EQ-CURSO-LEITURA",
        "title": "Curso de Leitura Oficial do Ano (DSA)",
        "description": "Ler o livro oficial do ano do Curso de Leitura dos Desbravadores indicado pela DSA."
    },
    {
        "id": "EQ-CLASSE-BIBLICA",
        "title": "Participação na Classe Bíblica do Clube",
        "description": "Participar ativamente das reuniões da Classe Bíblica do Clube durante o período anual."
    },
    {
        "id": "EQ-CAMINHADA-EXCURSIONISMO",
        "title": "Caminhada ao Ar Livre e Excursionismo Pedestre (5 a 20 km)",
        "description": "Participar da caminhada rústica na natureza (ao percorrer a maior distância, cumprem-se todas as distâncias menores)."
    },
    {
        "id": "EQ-ACAMPAMENTO-PRATICO",
        "title": "Acampamento Prático de Fim de Semana",
        "description": "Participar do acampamento de fim de semana com a unidade ou clube envolvendo montagem de barraca, culinária e vida campestre."
    },
    {
        "id": "EQ-PROJETO-COMUNITARIO",
        "title": "Projeto Comunitário da Igreja ou Cidade",
        "description": "Planejar e executar projeto comunitário oficial de auxílio à comunidade ou bairro."
    },
    {
        "id": "EQ-SERVICO-COMUNITARIO-HORAS",
        "title": "Dedicação de 2 Horas em Serviço ao Próximo",
        "description": "Dedicar 2 horas prestando socorro, alimentos ou apoio a pessoas doentes ou carentes."
    },
    {
        "id": "EQ-CERIMONIAS-E-EVENTOS",
        "title": "Participação em Cerimônia Oficial do Clube",
        "description": "Participar ativamente da organização ou execução de cerimônia de investidura, admissão em lenço ou Dia Mundial do Desbravador."
    },
    {
        "id": "EQ-SERMAO-DA-MONTANHA",
        "title": "Estudo das Bem-Aventuranças / Sermão da Montanha",
        "description": "Estudar, memorizar e demonstrar conhecimento do Sermão da Montanha / Bem-Aventuranças (Mt 5)."
    },
    {
        "id": "EQ-ESP-ARTES-MANUAIS",
        "title": "Especialidade em Artes e Habilidades Manuais",
        "description": "Completar uma especialidade oficial na área de Artes e Habilidades Manuais ou Artesanato (exigida igualmente em Amigo, Companheiro e Pesquisador)."
    },
    {
        "id": "EQ-ESP-NATUREZA-LIVRE",
        "title": "Nova Especialidade em Estudo da Natureza (Livre Escolha)",
        "description": "Completar uma nova especialidade oficial em Estudo da Natureza de livre escolha não realizada anteriormente (exigida em Pioneiro e Excursionista)."
    },
    {
        "id": "EQ-MOVEL-ACAMPAMENTO",
        "title": "Construção de Móvel de Acampamento com Amarras",
        "description": "Construir e utilizar móvel de acampamento em tamanho real com as amarras básicas e pioneiria."
    }
]


OFFICIAL_EQUIVALENCE_MAP = {
    # 1. EQ-MEMBRO-ATIVO (6)
    "AMIGO_I_2": "EQ-MEMBRO-ATIVO",
    "COMPANHEIRO_I_2": "EQ-MEMBRO-ATIVO",
    "PESQUISADOR_I_2": "EQ-MEMBRO-ATIVO",
    "PIONEIRO_I_2": "EQ-MEMBRO-ATIVO",
    "EXCURSIONISTA_I_2": "EQ-MEMBRO-ATIVO",
    "GUIA_I_2": "EQ-MEMBRO-ATIVO",

    # 2. EQ-CURSO-LEITURA (6)
    "AMIGO_I_4": "EQ-CURSO-LEITURA",
    "COMPANHEIRO_I_4": "EQ-CURSO-LEITURA",
    "PESQUISADOR_I_4": "EQ-CURSO-LEITURA",
    "PIONEIRO_I_4": "EQ-CURSO-LEITURA",
    "EXCURSIONISTA_I_4": "EQ-CURSO-LEITURA",
    "GUIA_I_4": "EQ-CURSO-LEITURA",

    # 3. EQ-CLASSE-BIBLICA (3)
    "AMIGO_I_6": "EQ-CLASSE-BIBLICA",
    "COMPANHEIRO_I_6": "EQ-CLASSE-BIBLICA",
    "PESQUISADOR_I_6": "EQ-CLASSE-BIBLICA",

    # 4. EQ-CAMINHADA-EXCURSIONISMO (5)
    "AMIGO_VI_1": "EQ-CAMINHADA-EXCURSIONISMO",
    "COMPANHEIRO_AVANCADO_AV_5": "EQ-CAMINHADA-EXCURSIONISMO",
    "PESQUISADOR_AVANCADO_AV_5": "EQ-CAMINHADA-EXCURSIONISMO",
    "PIONEIRO_AVANCADO_AV_3": "EQ-CAMINHADA-EXCURSIONISMO",
    "EXCURSIONISTA_VIII_1": "EQ-CAMINHADA-EXCURSIONISMO",

    # 5. EQ-ACAMPAMENTO-PRATICO (4)
    "COMPANHEIRO_VIII_2": "EQ-ACAMPAMENTO-PRATICO",
    "PESQUISADOR_VIII_1": "EQ-ACAMPAMENTO-PRATICO",
    "PIONEIRO_VIII_2": "EQ-ACAMPAMENTO-PRATICO",
    "GUIA_VIII_1": "EQ-ACAMPAMENTO-PRATICO",

    # 6. EQ-PROJETO-COMUNITARIO (4)
    "COMPANHEIRO_III_2": "EQ-PROJETO-COMUNITARIO",
    "PESQUISADOR_III_1": "EQ-PROJETO-COMUNITARIO",
    "PIONEIRO_III_2": "EQ-PROJETO-COMUNITARIO",
    "EXCURSIONISTA_III_2": "EQ-PROJETO-COMUNITARIO",

    # 7. EQ-SERVICO-COMUNITARIO-HORAS (2)
    "AMIGO_III_1": "EQ-SERVICO-COMUNITARIO-HORAS",
    "COMPANHEIRO_III_1": "EQ-SERVICO-COMUNITARIO-HORAS",

    # 8. EQ-CERIMONIAS-E-EVENTOS (2)
    "COMPANHEIRO_AVANCADO_AV_8": "EQ-CERIMONIAS-E-EVENTOS",
    "PESQUISADOR_AVANCADO_AV_6": "EQ-CERIMONIAS-E-EVENTOS",

    # 9. EQ-SERMAO-DA-MONTANHA (2)
    "COMPANHEIRO_II_4": "EQ-SERMAO-DA-MONTANHA",
    "PIONEIRO_II_1": "EQ-SERMAO-DA-MONTANHA",

    # 10. EQ-ESP-ARTES-MANUAIS (3)
    "AMIGO_IX_1": "EQ-ESP-ARTES-MANUAIS",
    "COMPANHEIRO_IX_1": "EQ-ESP-ARTES-MANUAIS",
    "PESQUISADOR_IX_1": "EQ-ESP-ARTES-MANUAIS",

    # 11. EQ-ESP-NATUREZA-LIVRE (2)
    "PIONEIRO_VII_2": "EQ-ESP-NATUREZA-LIVRE",
    "EXCURSIONISTA_VII_2": "EQ-ESP-NATUREZA-LIVRE",

    # 12. EQ-MOVEL-ACAMPAMENTO (2)
    "PESQUISADOR_AVANCADO_AV_8": "EQ-MOVEL-ACAMPAMENTO",
    "GUIA_VIII_3": "EQ-MOVEL-ACAMPAMENTO",
}


def req(
    class_slug,
    class_type,
    section_code,
    section_name,
    code,
    title,
    description,
    category,
    execution_context,
    tags,
    equivalence_group,
    selection_rule="TODOS",
    sub_items=None
):
    prefix = class_slug.upper().replace("-", "_")
    clean_code = code.replace(".", "_")
    req_id = f"{prefix}_{clean_code}"
    # Auditoria DSA: aplica somente os 8 grupos legítimos, desfazendo unificações espúrias
    valid_group = OFFICIAL_EQUIVALENCE_MAP.get(req_id, "")
    return {
        "id": req_id,
        "class_slug": class_slug,
        "class_type": class_type,
        "section_code": section_code,
        "section_name": section_name,
        "code": code,
        "title": title,
        "description": description,
        "category": category,
        "execution_context": execution_context,
        "tags": tags,
        "equivalence_group": valid_group,
        "selection_rule": selection_rule,
        "sub_items": sub_items or []
    }


CLASSES_DATA = [
    # =========================================================================
    # 1. AMIGO (10 ANOS) - REGULAR E AVANÇADA
    # =========================================================================
    {
        "slug": "amigo",
        "name": "Amigo",
        "advanced_slug": "amigo-avancado",
        "advanced_name": "Amigo da Natureza",
        "min_age": 10,
        "color_name": "Azul",
        "color_hex": "#1D4ED8",
        "logo_path": "/data/cartoes-oficiais/logos/logo_amigo.png",
        "official_url": "https://www.adventistas.org/pt/desbravadores/classes/amigo-e-amigo-da-natureza/",
        "mda_wiki_url": "https://mda.wiki.br/Cartão_de_Amigo/",
        "focus": "Jesus no Antigo Testamento, testemunho, princípios de saúde e trabalho para Deus.",
        "regular_requirements": [
            # I. GERAIS
            req("amigo", "REGULAR", "I", "Gerais", "I.1", "Ter no mínimo 10 anos de idade",
                "Ter, no mínimo, 10 anos de idade.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("amigo", "REGULAR", "I", "Gerais", "I.2", "Ser membro ativo do Clube",
                "Ser membro ativo do Clube de Desbravadores.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("amigo", "REGULAR", "I", "Gerais", "I.3", "Memorizar e explicar o Voto e a Lei",
                "Memorizar e explicar o Voto e a Lei do Desbravador.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("amigo", "REGULAR", "I", "Gerais", "I.4", "Ler o livro do Curso de Leitura do ano",
                "Ler o livro do Curso de Leitura do ano.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-CURSO-LEITURA"),
            req("amigo", "REGULAR", "I", "Gerais", "I.5", "Ler o livro 'Vaso de Barro'",
                "Ler o livro Vaso de Barro.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LIVRO-ESPECIFICO"),
            req("amigo", "REGULAR", "I", "Gerais", "I.6", "Participar ativamente da Classe Bíblica",
                "Participar ativamente da Classe Bíblica do seu Clube.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja"], "EQ-CLASSE-BIBLICA"),

            # II. DESCOBERTA ESPIRITUAL
            req("amigo", "REGULAR", "II", "Descoberta Espiritual", "II.1", "Memorizar Criação, 10 Pragas, 12 Tribos e 39 livros do AT",
                "Memorizar e demonstrar o seu conhecimento sobre Criação, 10 Pragas, 12 Tribos e 39 livros do Antigo Testamento.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "Criação: O que Deus criou em cada dia da Criação."},
                    {"code": "b", "text": "10 Pragas: Quais as pragas que caíram sobre o Egito."},
                    {"code": "c", "text": "12 Tribos: O nome de cada uma das 12 tribos de Israel."},
                    {"code": "d", "text": "39 livros do Antigo Testamento e demonstrar habilidade para encontrar qualquer um deles."}
                ]),
            req("amigo", "REGULAR", "II", "Descoberta Espiritual", "II.2", "Ler e explicar versos bíblicos (João 3:16, Ef 6:1-3, II Tm 3:16, Salmo 1)",
                "Ler e explicar os versos abaixo:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "João 3:16"},
                    {"code": "b", "text": "Efésios 6:1-3"},
                    {"code": "c", "text": "II Timóteo 3:16"},
                    {"code": "d", "text": "Salmo 1"}
                ]),
            req("amigo", "REGULAR", "II", "Descoberta Espiritual", "II.3", "Leitura Bíblica (Gênesis e Êxodo selecionados)",
                "Leitura bíblica: Gn 1, Gn 2, Gn 3, Gn 4:1-16, Gn 6:11-22, Gn 7, Gn 8, Gn 9:1-19, Gn 11:1-9, Gn 12:1-10, Gn 13, Gn 14:18-24, Gn 15, Gn 17:1-8; 15-22, Gn 18:1-15, Gn 18:16-33, Gn 19:1-29, Gn 21:1-21, Gn 22:1-19, Gn 23, Gn 24:1-46, 48, Gn 24:52-67, Gn 27, Gn 28, Gn 29, Gn 30:25-31; 31:2-3, 17-18, Gn 32, Gn 33, Gn 37, Gn 39, Gn 40, Gn 41, Gn 42, Gn 43, Gn 44, Gn 45, Gn 47, Gn 50, Êx 1, Êx 2, Êx 3, Êx 4:1-17; 27-31, Êx 5, Êx 7, Êx 8, Êx 9, Êx 10, 11, Êx 12, Êx 13:17-22; 14, Êx 15:22-27; 16, Êx 17, Êx 18, Êx 19, Êx 20, Êx 24, Êx 32, Êx 33, Êx 34:1-14; 29-35, Êx 35:4-29 e 40.",
                "ESPIRITUAL_E_BIBLIA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LEITURA-BIBLICA"),

            # III. SERVINDO A OUTROS
            req("amigo", "REGULAR", "III", "Servindo a Outros", "III.1", "Dedicar 2 horas ajudando alguém na comunidade",
                "Dedicar duas horas ajudando alguém em sua comunidade, através de duas das seguintes atividades:",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade"], "EQ-PROJETO-COMUNITARIO", "ESCOLHER_2", [
                    {"code": "a", "text": "Visitar alguém que precisa de amizade e orar com essa pessoa."},
                    {"code": "b", "text": "Oferecer alimento a alguém carente."},
                    {"code": "c", "text": "Participar de um projeto ecológico ou educativo."}
                ]),
            req("amigo", "REGULAR", "III", "Servindo a Outros", "III.2", "Redação sobre como ser um bom cidadão no lar e na escola",
                "Escrever uma redação explicando como ser um bom cidadão no lar e na escola.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "em_casa"], "EQ-PROJETO-COMUNITARIO"),

            # IV. DESENVOLVENDO AMIZADE
            req("amigo", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.1", "10 qualidades de um bom amigo e Regra Áurea (Mateus 7:12)",
                "Mencionar dez qualidades de um bom amigo e apresentar quatro situações diárias onde você praticou a Regra Áurea de Mateus 7:12.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("amigo", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.2", "Cantar o Hino Nacional e conhecer sua história e autores",
                "Saber cantar o Hino Nacional de seu país e conhecer sua história. Saber o nome do autor da letra e da música do hino.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "civismo_ordem_unida"], "EQ-CIVISMO-BANDEIRAS"),

            # V. SAÚDE E APTIDÃO FÍSICA
            req("amigo", "REGULAR", "V", "Saúde e Aptidão Física", "V.1", "Especialidade de Aptidão ou Segurança (Natação I, Cultura Física, Nós ou Segurança na Água)",
                "Completar uma das seguintes especialidades:",
                "ESPECIALIDADES", "AR_LIVRE", ["especialidade", "ar_livre", "reuniao_clube"], "EQ-ESP-SOCORROS-RESGATE-SEGURANCA", "ESCOLHER_1", [
                    {"code": "a", "text": "Natação principiante I"},
                    {"code": "b", "text": "Cultura física"},
                    {"code": "c", "text": "Nós e amarras"},
                    {"code": "d", "text": "Segurança básica na água"}
                ]),
            req("amigo", "REGULAR", "V", "Saúde e Aptidão Física", "V.2", "Princípios de temperança de Daniel 1 e compromisso pessoal",
                "Utilizando a experiência de Daniel:",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao", "memorizacao"], "EQ-TEMPERANCA-SAUDE", "TODOS", [
                    {"code": "a", "text": "Explicar os princípios de temperança que ele defendeu ou participar em uma apresentação ou encenação sobre Daniel 1."},
                    {"code": "b", "text": "Memorizar e explicar Daniel 1:8."},
                    {"code": "c", "text": "Escrever seu compromisso pessoal de seguir um estilo de vida saudável."}
                ]),
            req("amigo", "REGULAR", "V", "Saúde e Aptidão Física", "V.3", "Princípios de uma dieta saudável e quadro dos grupos de alimentos",
                "Aprender os princípios de uma dieta saudável e ajudar a preparar um quadro com os grupos básicos de alimentos.",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-TEMPERANCA-SAUDE"),

            # VI. ORGANIZAÇÃO E LIDERANÇA
            req("amigo", "REGULAR", "VI", "Organização e Liderança", "VI.1", "Acompanhar planejamento e execução de caminhada de 5 km",
                "Através da observação, acompanhar todo o processo de planejamento até a execução de uma caminhada de 5 km.",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "caminhada"], "EQ-CAMINHADA-EXCURSIONISMO"),

            # VII. ESTUDO DA NATUREZA
            req("amigo", "REGULAR", "VII", "Estudo da Natureza", "VII.1", "Especialidade de Estudo da Natureza (Felinos, Cães, Mamíferos, Sementes ou Aves de Estimação)",
                "Completar uma das seguintes especialidades:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-NATUREZA-ECOLOGIA", "ESCOLHER_1", [
                    {"code": "a", "text": "Felinos"},
                    {"code": "b", "text": "Cães"},
                    {"code": "c", "text": "Mamíferos"},
                    {"code": "d", "text": "Sementes"},
                    {"code": "e", "text": "Aves de estimação"}
                ]),
            req("amigo", "REGULAR", "VII", "Estudo da Natureza", "VII.2", "Purificar água e escrever sobre Jesus como a água da vida",
                "Aprender e demonstrar uma maneira para purificar a água e escrever um parágrafo destacando o significado de Jesus como a água da vida.",
                "ACAMPAMENTO_E_PIONEIRIA", "AR_LIVRE", ["ar_livre", "acampamento", "reuniao_clube"], "EQ-FOGUEIRA-COZINHA"),
            req("amigo", "REGULAR", "VII", "Estudo da Natureza", "VII.3", "Aprender e montar uma barraca em local apropriado",
                "Aprender e montar uma barraca em local apropriado.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre"], "EQ-ACAMPAMENTO-PRATICO"),

            # VIII. ARTE DE ACAMPAR
            req("amigo", "REGULAR", "VIII", "Arte de Acampar", "VIII.1", "Cuidar de uma corda e fazer 14 nós básicos",
                "Demonstrar como cuidar corretamente de uma corda. Fazer e explicar o uso prático dos seguintes nós:",
                "ACAMPAMENTO_E_PIONEIRIA", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre", "nos_e_amarras"], "EQ-NOS-AMARRAS-PIONEIRIA", "TODOS", [
                    {"code": "a", "text": "Simples"},
                    {"code": "b", "text": "Cego"},
                    {"code": "c", "text": "Direito"},
                    {"code": "d", "text": "Cirurgião"},
                    {"code": "e", "text": "Laís de guia"},
                    {"code": "f", "text": "Laís de guia duplo"},
                    {"code": "g", "text": "Escota"},
                    {"code": "h", "text": "Catau"},
                    {"code": "i", "text": "Pescador"},
                    {"code": "j", "text": "Fateixa"},
                    {"code": "k", "text": "Volta do fiel"},
                    {"code": "l", "text": "Nó de gancho"},
                    {"code": "m", "text": "Volta da ribeira"},
                    {"code": "n", "text": "Ordinário"}
                ]),
            req("amigo", "REGULAR", "VIII", "Arte de Acampar", "VIII.2", "Completar a especialidade de Acampamento I",
                "Completar a especialidade de Acampamento I.",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre"], "EQ-ESP-ACAMPAMENTO-ARTE"),
            req("amigo", "REGULAR", "VIII", "Arte de Acampar", "VIII.3", "Apresentar 10 regras para caminhada e o que fazer quando perdido",
                "Apresentar dez regras para uma caminhada e explicar o que fazer quando estiver perdido.",
                "CAMINHADA_E_ORIENTACAO", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre", "caminhada"], "EQ-CAMINHADA-EXCURSIONISMO"),
            req("amigo", "REGULAR", "VIII", "Arte de Acampar", "VIII.4", "Sinais de pista: preparar e seguir pista com no mínimo 10 sinais",
                "Aprender os sinais para seguir uma pista. Preparar e seguir uma pista de no mínimo 10 sinais, que também possa ser seguida por outros.",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "orientacao_bussola"], "EQ-ORIENTACAO-PISTAS-CODIGOS"),

            # IX. ESTILO DE VIDA
            req("amigo", "REGULAR", "IX", "Estilo de Vida", "IX.1", "Completar uma especialidade em Artes e Habilidades Manuais",
                "Completar uma especialidade na área de Artes e habilidades manuais.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ARTES-MANUAIS")
        ],
        "advanced_requirements": [
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.1", "Memorizar, cantar ou tocar o Hino dos Desbravadores e conhecer sua história",
                "Memorizar, cantar ou tocar o Hino dos Desbravadores e conhecer a história do hino.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.2", "Estudar um personagem do AT (José, Jonas, Ester ou Rute)",
                "Em consulta com seu líder, escolher um dos seguintes personagens do Antigo Testamento e conversar com seu grupo sobre o amor e cuidado de Deus e o livramento demonstrado na vida do personagem escolhido:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA", "ESCOLHER_1", [
                    {"code": "a", "text": "José"},
                    {"code": "b", "text": "Jonas"},
                    {"code": "c", "text": "Ester"},
                    {"code": "d", "text": "Rute"}
                ]),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.3", "Levar 2 amigos não adventistas à Escola Sabatina ou ao Clube",
                "Levar pelo menos dois amigos não adventistas à Escola Sabatina ou ao Clube de Desbravadores.",
                "COMUNIDADE_E_MISSAO", "IGREJA", ["igreja", "reuniao_clube"], "EQ-MISSAO-EVANGELISMO"),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.4", "Conhecer princípios de higiene, boas maneiras à mesa e comportamento",
                "Conhecer os princípios de higiene, de boas maneiras à mesa e como se comportar diante de pessoas que tenham diferentes idades. Demonstrar e explicar como estas boas maneiras podem ser úteis nas reuniões e acampamentos do Clube.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "acampamento"], "EQ-ACAMPAMENTO-PRATICO"),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.5", "Completar a especialidade de Arte de Acampar",
                "Completar a especialidade de Arte de acampar.",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre"], "EQ-ESP-ACAMPAMENTO-ARTE"),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.6", "Conhecer e identificar 10 flores silvestres e 10 insetos de sua região",
                "Conhecer e identificar 10 flores silvestres e 10 insetos de sua região.",
                "NATUREZA_E_ECOLOGIA", "AR_LIVRE", ["ar_livre", "acampamento"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.7", "Começar uma fogueira usando materiais naturais e mantê-la acesa",
                "Começar uma fogueira usando materiais naturais, e mantê-la acesa.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "fogueira_cozinha"], "EQ-FOGUEIRA-COZINHA"),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.8", "Usar corretamente faca, facão ou machadinha e conhecer 10 regras de segurança",
                "Usar corretamente uma faca, facão ou uma machadinha e conhecer 10 regras para usá-los com segurança.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "primeiros_socorros"], "EQ-FERRAMENTAS-CORTE"),
            req("amigo-avancado", "AVANCADA", "AV", "Amigo da Natureza", "AV.9", "Completar uma especialidade em Atividades Missionárias ou Agrícolas",
                "Escolher e completar uma especialidade em uma das áreas abaixo:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS", "ESCOLHER_1", [
                    {"code": "a", "text": "Atividades missionárias"},
                    {"code": "b", "text": "Atividades agrícolas"}
                ])
        ]
    },

    # =========================================================================
    # 2. COMPANHEIRO (11 ANOS) - REGULAR E AVANÇADA
    # =========================================================================
    {
        "slug": "companheiro",
        "name": "Companheiro",
        "advanced_slug": "companheiro-avancado",
        "advanced_name": "Companheiro de Excursionismo",
        "min_age": 11,
        "color_name": "Vermelho",
        "color_hex": "#DC2626",
        "logo_path": "/data/cartoes-oficiais/logos/logo_companheiro.png",
        "official_url": "https://www.adventistas.org/pt/desbravadores/classes/companheiro-e-companheiro-de-excursionismo/",
        "mda_wiki_url": "https://mda.wiki.br/Cartão_de_Companheiro/",
        "focus": "Jesus no Novo Testamento, males do cigarro e outras drogas, testemunho e o que Deus espera deles.",
        "regular_requirements": [
            # I. GERAIS
            req("companheiro", "REGULAR", "I", "Gerais", "I.1", "Ter no mínimo 11 anos de idade",
                "Ter, no mínimo, 11 anos de idade.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("companheiro", "REGULAR", "I", "Gerais", "I.2", "Ser membro ativo do Clube",
                "Ser membro ativo do Clube de Desbravadores.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("companheiro", "REGULAR", "I", "Gerais", "I.3", "Ilustrar de forma criativa o significado do Voto do Desbravador",
                "Ilustrar de forma criativa o significado do Voto do Desbravador.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("companheiro", "REGULAR", "I", "Gerais", "I.4", "Ler o livro do Curso de Leitura do ano e escrever um parágrafo",
                "Ler o livro do Curso de Leitura do ano e escrever um parágrafo sobre o que mais lhe chamou atenção ou considerou importante.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-CURSO-LEITURA"),
            req("companheiro", "REGULAR", "I", "Gerais", "I.5", "Ler o livro 'Um Simples Lanche'",
                "Ler o livro Um simples lanche.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LIVRO-ESPECIFICO"),
            req("companheiro", "REGULAR", "I", "Gerais", "I.6", "Participar ativamente da Classe Bíblica",
                "Participar ativamente da Classe Bíblica do seu Clube.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja"], "EQ-CLASSE-BIBLICA"),

            # II. DESCOBERTA ESPIRITUAL
            req("companheiro", "REGULAR", "II", "Descoberta Espiritual", "II.1", "Memorizar os 10 Mandamentos e os 27 livros do Novo Testamento",
                "Memorizar e demonstrar o seu conhecimento:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "10 Mandamentos: A Lei de Deus dada a Moisés."},
                    {"code": "b", "text": "27 livros do Novo Testamento e demonstrar habilidade para encontrar qualquer um deles."}
                ]),
            req("companheiro", "REGULAR", "II", "Descoberta Espiritual", "II.2", "Ler e explicar versos bíblicos (Is 41:9-10, Hb 13:5, Pv 22:6, I Jo 1:9, Salmo 8)",
                "Ler e explicar os versos abaixo:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "Isaías 41:9-10"},
                    {"code": "b", "text": "Hebreus 13:5"},
                    {"code": "c", "text": "Provérbios 22:6"},
                    {"code": "d", "text": "I João 1:9"},
                    {"code": "e", "text": "Salmo 8"}
                ]),
            req("companheiro", "REGULAR", "II", "Descoberta Espiritual", "II.3", "Leitura Bíblica (Levítico a 2 Samuel selecionados)",
                "Leitura bíblica: Lv 11, Nm 9:15-23, 11, 12, 13, 14:1-38, 16, 17, 20:1-13; 22-29, 21:4-9, 22, 23; 24:1-10, Dt 1:1-17; 4:1-8, 32:1-43, 33, 34, Js 1, 2, 3, 4, 5:10; 6, 7, 9, 24:1-15; 29, Jz 6, 7, 13:1-18; 14, 15, 16, Rt 1, 2, 3, 4, 1 Sm 1, 2, 3, 4, 5, 6, 8, 9, 10, 11:12-15, 12, 13, 15, 16, 17, 18:1-19, 20, 21:1-7; 22, 24, 25, 26, 31, 2 Sm 1, 5, 6, 7, 9, 11; 12:1-25, 15, 18.",
                "ESPIRITUAL_E_BIBLIA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LEITURA-BIBLICA"),
            req("companheiro", "REGULAR", "II", "Descoberta Espiritual", "II.4", "Estudar tema de Jesus (Parábola, Milagre, Sermão da Montanha ou Segunda Vinda)",
                "Em consulta com o seu conselheiro, escolher um dos seguintes temas e demonstrar seu conhecimento (troca de ideias, atividade em grupo ou redação):",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA", "ESCOLHER_1", [
                    {"code": "a", "text": "Uma parábola de Jesus"},
                    {"code": "b", "text": "Um milagre de Jesus"},
                    {"code": "c", "text": "O Sermão da Montanha"},
                    {"code": "d", "text": "Um sermão sobre a Segunda Vinda de Cristo"}
                ]),

            # III. SERVINDO A OUTROS
            req("companheiro", "REGULAR", "III", "Servindo a Outros", "III.1", "Dedicar 2 horas servindo a comunidade e demonstrando companheirismo",
                "Planejar e dedicar pelo menos duas horas servindo sua comunidade e demonstrando companheirismo a alguém, de maneira prática.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade"], "EQ-PROJETO-COMUNITARIO"),
            req("companheiro", "REGULAR", "III", "Servindo a Outros", "III.2", "Participar de um projeto que beneficiará a comunidade ou igreja",
                "Participar de um projeto que beneficiará sua comunidade ou igreja.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade", "igreja"], "EQ-PROJETO-COMUNITARIO"),

            # IV. DESENVOLVENDO AMIZADE
            req("companheiro", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.1", "Conversar sobre respeito a diferentes culturas, raça e sexo",
                "Conversar com seu Conselheiro ou Unidade sobre como respeitar pessoas de diferentes culturas, raça e sexo.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO"),

            # V. SAÚDE E APTIDÃO FÍSICA
            req("companheiro", "REGULAR", "V", "Saúde e Aptidão Física", "V.1", "Memorizar e explicar I Coríntios 9:24-27",
                "Memorizar e explicar I Coríntios 9:24-27.",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-TEMPERANCA-SAUDE"),
            req("companheiro", "REGULAR", "V", "Saúde e Aptidão Física", "V.2", "Conversar sobre aptidão física e exercícios regulares",
                "Conversar com seu líder sobre a aptidão física e os exercícios físicos regulares que se relacionam com uma vida saudável.",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre"], "EQ-TEMPERANCA-SAUDE"),
            req("companheiro", "REGULAR", "V", "Saúde e Aptidão Física", "V.3", "Prejuízos do cigarro e compromisso de não fumar",
                "Aprender sobre os prejuízos que o cigarro causa à saúde e escrever seu compromisso de não fazer uso do fumo.",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-TEMPERANCA-SAUDE"),
            req("companheiro", "REGULAR", "V", "Saúde e Aptidão Física", "V.4", "Especialidade de Natação Principiante II ou Acampamento II",
                "Completar uma das seguintes especialidades:",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre"], "EQ-ESP-ACAMPAMENTO-ARTE", "ESCOLHER_1", [
                    {"code": "a", "text": "Natação principiante II"},
                    {"code": "b", "text": "Acampamento II"}
                ]),

            # VI. ORGANIZAÇÃO E LIDERANÇA
            req("companheiro", "REGULAR", "VI", "Organização e Liderança", "VI.1", "Dirigir ou colaborar em uma meditação criativa para Unidade ou Clube",
                "Dirigir ou colaborar em uma meditação criativa para sua Unidade ou Clube.",
                "LIDERANCA_E_IGREJA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),
            req("companheiro", "REGULAR", "VI", "Organização e Liderança", "VI.2", "Ajudar no planejamento de uma excursão ou acampamento com pernoite",
                "Ajudar no planejamento de uma excursão ou acampamento com sua Unidade ou Clube, envolvendo pelo menos um pernoite.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "reuniao_clube"], "EQ-ACAMPAMENTO-PRATICO"),

            # VII. ESTUDO DA NATUREZA
            req("companheiro", "REGULAR", "VII", "Estudo da Natureza", "VII.1", "Participar de jogos na natureza ou caminhada ecológica por 1 hora",
                "Participar de jogos na natureza ou caminhada ecológica, pelo período de uma hora.",
                "NATUREZA_E_ECOLOGIA", "AR_LIVRE", ["ar_livre", "caminhada"], "EQ-CAMINHADA-EXCURSIONISMO"),
            req("companheiro", "REGULAR", "VII", "Estudo da Natureza", "VII.2", "Especialidade de Estudo da Natureza (Anfíbios, Aves, Répteis, Árvores, etc.)",
                "Completar uma das seguintes especialidades:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-NATUREZA-ECOLOGIA", "ESCOLHER_1", [
                    {"code": "a", "text": "Anfíbios"},
                    {"code": "b", "text": "Aves"},
                    {"code": "c", "text": "Aves domésticas"},
                    {"code": "d", "text": "Pecuária"},
                    {"code": "e", "text": "Répteis"},
                    {"code": "f", "text": "Moluscos"},
                    {"code": "g", "text": "Árvores"},
                    {"code": "h", "text": "Arbustos"}
                ]),
            req("companheiro", "REGULAR", "VII", "Estudo da Natureza", "VII.3", "Recapitular estudo da Criação e fazer diário de observações por 7 dias",
                "Recapitular o estudo da Criação e fazer um diário por sete dias registrando suas observações do que foi criado em cada dia correspondente.",
                "NATUREZA_E_ECOLOGIA", "CASA_INDIVIDUAL", ["em_casa", "ar_livre"], "EQ-IDENTIFICACAO-NATUREZA"),

            # VIII. ARTE DE ACAMPAR
            req("companheiro", "REGULAR", "VIII", "Arte de Acampar", "VIII.1", "Descobrir pontos cardeais sem bússola e desenhar a Rosa dos Ventos",
                "Descobrir os pontos cardeais sem a ajuda de uma bússola e desenhar a Rosa dos Ventos.",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "orientacao_bussola", "reuniao_clube"], "EQ-ORIENTACAO-PISTAS-CODIGOS"),
            req("companheiro", "REGULAR", "VIII", "Arte de Acampar", "VIII.2", "Participar de acampamento de fim de semana e fazer relatório",
                "Participar de um acampamento de final de semana e fazer um relatório destacando o que mais lhe impressionou positivamente.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre"], "EQ-ACAMPAMENTO-PRATICO"),
            req("companheiro", "REGULAR", "VIII", "Arte de Acampar", "VIII.3", "Aprender ou recapitular 9 nós de Companheiro",
                "Aprender ou recapitular os seguintes nós:",
                "ACAMPAMENTO_E_PIONEIRIA", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre", "nos_e_amarras"], "EQ-NOS-AMARRAS-PIONEIRIA", "TODOS", [
                    {"code": "a", "text": "Oito"},
                    {"code": "b", "text": "Volta do salteador"},
                    {"code": "c", "text": "Duplo"},
                    {"code": "d", "text": "Caminhoneiro"},
                    {"code": "e", "text": "Direito"},
                    {"code": "f", "text": "Volta do Fiel"},
                    {"code": "g", "text": "Escota"},
                    {"code": "h", "text": "Laís de Guia"},
                    {"code": "i", "text": "Simples"}
                ]),

            # IX. ESTILO DE VIDA
            req("companheiro", "REGULAR", "IX", "Estilo de Vida", "IX.1", "Completar uma nova especialidade em Artes e Habilidades Manuais",
                "Completar uma especialidade não realizada anteriormente na seção de Artes e habilidades manuais.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ARTES-MANUAIS")
        ],
        "advanced_requirements": [
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.1", "Composição, significado e uso correto da Bandeira Nacional",
                "Aprender e demonstrar a composição, significado e uso correto da Bandeira Nacional.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "civismo_ordem_unida"], "EQ-CIVISMO-BANDEIRAS"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.2", "Ler a primeira visão de Ellen White (Primeiros Escritos, p. 13-20)",
                "Ler a primeira visão de Ellen White e discutir como Deus usa os profetas para apresentar Sua mensagem à igreja (Primeiros Escritos, págs. 13 à 20).",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "leitura", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.3", "Participar de atividade missionária ou comunitária envolvendo um amigo",
                "Participar de uma atividade missionária ou comunitária, envolvendo também um amigo.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade", "igreja"], "EQ-MISSAO-EVANGELISMO"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.4", "Conversar sobre respeito aos pais e listar como cuidam de você",
                "Conversar com seu Conselheiro ou Unidade sobre como demonstrar respeito pelos seus pais ou responsáveis e fazer uma lista mostrando como cuidam de você.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.5", "Participar de caminhada de 6 km e preparar relatório de 1 página",
                "Participar de uma caminhada de 6 km, preparando, ao final, um relatório de uma página.",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "caminhada"], "EQ-CAMINHADA-EXCURSIONISMO"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.6", "Atividade educativa sobre saúde e prevenção às drogas/fumo",
                "Escolher um dos seguintes itens:",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "comunidade"], "EQ-TEMPERANCA-SAUDE", "ESCOLHER_1", [
                    {"code": "a", "text": "Assistir a um 'Curso como deixar de fumar'"},
                    {"code": "b", "text": "Assistir a dois filmes sobre saúde"},
                    {"code": "c", "text": "Elaborar um cartaz sobre o prejuízo das drogas"},
                    {"code": "d", "text": "Ajudar a preparar material para uma exposição ou passeata sobre saúde"},
                    {"code": "e", "text": "Pesquisar na internet informações sobre saúde e escrever uma página sobre os resultados encontrados"}
                ]),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.7", "Identificar e descrever 12 aves nativas e 12 árvores nativas",
                "Identificar e descrever 12 aves nativas e 12 árvores nativas.",
                "NATUREZA_E_ECOLOGIA", "AR_LIVRE", ["ar_livre", "acampamento"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.8", "Participar de cerimônia (Investidura, Admissão em Lenço ou Dia Mundial) e sugerir ideias",
                "Participar de uma das seguintes cerimônias e sugerir ideias criativas de como realizá-las:",
                "LIDERANCA_E_IGREJA", "IGREJA", ["igreja", "reuniao_clube"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA", "ESCOLHER_1", [
                    {"code": "a", "text": "Investidura"},
                    {"code": "b", "text": "Admissão em lenço"},
                    {"code": "c", "text": "Dia Mundial do Desbravador"}
                ]),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.9", "Preparar uma refeição em uma fogueira durante um acampamento",
                "Preparar uma refeição em uma fogueira durante um acampamento do Clube ou Unidade.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "fogueira_cozinha"], "EQ-FOGUEIRA-COZINHA"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.10", "Preparar um quadro com 15 nós diferentes",
                "Preparar um quadro com 15 nós diferentes.",
                "ACAMPAMENTO_E_PIONEIRIA", "REUNIAO_CLUBE", ["reuniao_clube", "nos_e_amarras"], "EQ-NOS-AMARRAS-PIONEIRIA"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.11", "Completar a especialidade de Excursionismo Pedestre com Mochila",
                "Completar a especialidade de Excursionismo pedestre com mochila.",
                "ESPECIALIDADES", "AR_LIVRE", ["especialidade", "ar_livre", "caminhada", "acampamento"], "EQ-ESP-ACAMPAMENTO-ARTE"),
            req("companheiro-avancado", "AVANCADA", "AV", "Companheiro de Excursionismo", "AV.12", "Completar uma especialidade em Habilidades Domésticas, Saúde, Missão ou Agrícola",
                "Completar uma especialidade não realizada anteriormente:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS", "ESCOLHER_1", [
                    {"code": "a", "text": "Habilidades domésticas"},
                    {"code": "b", "text": "Ciência e saúde"},
                    {"code": "c", "text": "Atividades missionárias e comunitárias"},
                    {"code": "d", "text": "Atividades agrícolas"}
                ])
        ]
    },

    # =========================================================================
    # 3. PESQUISADOR (12 ANOS) - REGULAR E AVANÇADA
    # =========================================================================
    {
        "slug": "pesquisador",
        "name": "Pesquisador",
        "advanced_slug": "pesquisador-avancado",
        "advanced_name": "Pesquisador de Campo e Bosque",
        "min_age": 12,
        "color_name": "Verde",
        "color_hex": "#16A34A",
        "logo_path": "/data/cartoes-oficiais/logos/logo_pesquisador.png",
        "official_url": "https://www.adventistas.org/pt/desbravadores/classes/pesquisador-e-pesquisador-de-campo-e-bosque/",
        "mda_wiki_url": "https://mda.wiki.br/Cartão_de_Pesquisador/",
        "focus": "Jesus nos evangelhos, prevenir o uso de álcool e drogas, testemunho e o que podem fazer para Deus.",
        "regular_requirements": [
            # I. GERAIS
            req("pesquisador", "REGULAR", "I", "Gerais", "I.1", "Ter no mínimo 12 anos de idade",
                "Ter, no mínimo, 12 anos de idade.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("pesquisador", "REGULAR", "I", "Gerais", "I.2", "Ser membro ativo do Clube",
                "Ser membro ativo do Clube de Desbravadores.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("pesquisador", "REGULAR", "I", "Gerais", "I.3", "Demonstrar compreensão da Lei do Desbravador (Representação, Debate ou Redação)",
                "Demonstrar sua compreensão do significado da Lei do Desbravador através de uma das seguintes atividades:",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO", "ESCOLHER_1", [
                    {"code": "a", "text": "Representação"},
                    {"code": "b", "text": "Debate"},
                    {"code": "c", "text": "Redação"}
                ]),
            req("pesquisador", "REGULAR", "I", "Gerais", "I.4", "Ler o livro do Curso de Leitura do ano e escrever dois parágrafos",
                "Ler o livro do Curso de Leitura do ano e escrever dois parágrafos sobre o que mais lhe chamou atenção ou considerou importante.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-CURSO-LEITURA"),
            req("pesquisador", "REGULAR", "I", "Gerais", "I.5", "Ler o livro 'Além da Magia'",
                "Ler o livro Além da magia.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LIVRO-ESPECIFICO"),
            req("pesquisador", "REGULAR", "I", "Gerais", "I.6", "Participar ativamente da Classe Bíblica",
                "Participar ativamente da Classe Bíblica do seu Clube.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja"], "EQ-CLASSE-BIBLICA"),

            # II. DESCOBERTA ESPIRITUAL
            req("pesquisador", "REGULAR", "II", "Descoberta Espiritual", "II.1", "Memorizar e demonstrar conhecimento de Levítico 11 (alimentos)",
                "Memorizar e demonstrar o seu conhecimento: a) Levítico 11: regras dos alimentos considerados comestíveis e não comestíveis.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("pesquisador", "REGULAR", "II", "Descoberta Espiritual", "II.2", "Ler e explicar versos bíblicos (Ec 12:13-14, Rm 6:23, Ap 1:3, Is 43:1-2, Sl 51:10, Salmo 16)",
                "Ler e explicar os versos abaixo:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "Eclesiastes 12:13-14"},
                    {"code": "b", "text": "Romanos 6:23"},
                    {"code": "c", "text": "Apocalipse 1:3"},
                    {"code": "d", "text": "Isaías 43:1-2"},
                    {"code": "e", "text": "Salmo 51:10"},
                    {"code": "f", "text": "Salmo 16"}
                ]),
            req("pesquisador", "REGULAR", "II", "Descoberta Espiritual", "II.3", "Leitura Bíblica (1 Reis a Eclesiastes 1 selecionados)",
                "Leitura bíblica: 1 Rs 1:28-53, 3, 4:20-34, 5, 6, 8:12-60, 10, 11:6-43, 12, 16:29-33, 17:1-7, 17:8-24, 18, 19, 21, 2 Rs 2, 4:1-7, 4:8-41, 5, 6:1-23, 6:24-33, 7, 20, 22, 23:36-37, 24, 25:1-7, 2 Cr 24:1-14, 36, Ed 1, 3, 6:14-15, Ne 1, 2, 4, 8, Ester 1, 2, 3, 4, 5, 6, 7, 8, Jó 1, 2, 42, Sl 1, 15, 19, 23, 24, 27, 37, 39, 42, 46, 67, 90, 91, 92, 97, 98, 100, 117, 119:1-176, 121, 125, 150, Pv 1, 3, 4, 10, 15, 20, 25, Ec 1.",
                "ESPIRITUAL_E_BIBLIA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LEITURA-BIBLICA"),
            req("pesquisador", "REGULAR", "II", "Descoberta Espiritual", "II.4", "Estudar história de salvação nos Evangelhos (Nicodemos, Samaritana, Bom Samaritano, Filho Pródigo ou Zaqueu)",
                "Conversar com seu líder e escolher uma das seguintes histórias, demonstrando sua compreensão em como Jesus salva as pessoas (conversa em grupo, mensagem no Clube, cartazes/maquete ou poesia/hino):",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA", "ESCOLHER_1", [
                    {"code": "a", "text": "João 3 – Nicodemos"},
                    {"code": "b", "text": "João 4 – A mulher samaritana"},
                    {"code": "c", "text": "Lucas 10 – O bom samaritano"},
                    {"code": "d", "text": "Lucas 15 – O filho pródigo"},
                    {"code": "e", "text": "Lucas 19 – Zaqueu"}
                ]),

            # III. SERVINDO A OUTROS
            req("pesquisador", "REGULAR", "III", "Servindo a Outros", "III.1", "Conhecer projetos comunitários da cidade e participar de pelo menos um",
                "Conhecer os projetos comunitários desenvolvidos em sua cidade e participar de, pelo menos, um deles com sua Unidade ou Clube.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade"], "EQ-PROJETO-COMUNITARIO"),
            req("pesquisador", "REGULAR", "III", "Servindo a Outros", "III.2", "Participar em três atividades missionárias da igreja",
                "Participar em três atividades missionárias da igreja.",
                "COMUNIDADE_E_MISSAO", "IGREJA", ["igreja", "comunidade"], "EQ-MISSAO-EVANGELISMO"),

            # IV. DESENVOLVENDO AMIZADE
            req("pesquisador", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.1", "Debate ou representação sobre pressão de grupo e tomada de decisões",
                "Participar de um debate ou representação sobre a pressão de grupo e identificar a influência que isso exerce sobre suas decisões.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("pesquisador", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.2", "Visitar um órgão público da cidade/bairro e descobrir como o Clube pode ser útil",
                "Visitar um órgão público de sua cidade ou bairro e descobrir de que maneiras o Clube pode ser útil à sua comunidade.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade", "civismo_ordem_unida"], "EQ-PROJETO-COMUNITARIO"),

            # V. SAÚDE E APTIDÃO FÍSICA
            req("pesquisador", "REGULAR", "V", "Saúde e Aptidão Física", "V.1", "Discussão/vídeo sobre efeitos do álcool e drogas + texto de compromisso",
                "Escolher uma das atividades abaixo e escrever um texto pessoal para um estilo de vida livre do álcool:",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-TEMPERANCA-SAUDE", "ESCOLHER_1", [
                    {"code": "a", "text": "Participar de uma discussão em classe sobre os efeitos do álcool no organismo."},
                    {"code": "b", "text": "Assistir a um vídeo sobre o efeito do álcool ou outras drogas no corpo humano e conversar sobre o assunto."}
                ]),

            # VI. ORGANIZAÇÃO E LIDERANÇA
            req("pesquisador", "REGULAR", "VI", "Organização e Liderança", "VI.1", "Dirigir cerimônia de abertura da reunião semanal ou programa da Escola Sabatina",
                "Dirigir uma cerimônia de abertura da reunião semanal do seu Clube ou um programa da Escola Sabatina.",
                "LIDERANCA_E_IGREJA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja", "civismo_ordem_unida"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),
            req("pesquisador", "REGULAR", "VI", "Organização e Liderança", "VI.2", "Ajudar a organizar a Classe Bíblica do Clube",
                "Ajudar a organizar a Classe Bíblica do seu Clube.",
                "LIDERANCA_E_IGREJA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja"], "EQ-CLASSE-BIBLICA"),

            # VII. ESTUDO DA NATUREZA
            req("pesquisador", "REGULAR", "VII", "Estudo da Natureza", "VII.1", "Identificar Alfa de Centauro e constelação de Órion e seu significado espiritual",
                "Identificar a estrela Alfa da constelação de Centauro e a constelação de Órion. Conhecer o significado espiritual de Órion, como descrito no livro Primeiros Escritos, pág. 41.",
                "NATUREZA_E_ECOLOGIA", "ACAMPAMENTO", ["ar_livre", "acampamento"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("pesquisador", "REGULAR", "VII", "Estudo da Natureza", "VII.2", "Especialidade de Estudo da Natureza (Astronomia, Cactos, Climatologia, Flores ou Rastreio)",
                "Completar uma das especialidades abaixo:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube", "ar_livre"], "EQ-ESP-NATUREZA-ECOLOGIA", "ESCOLHER_1", [
                    {"code": "a", "text": "Astronomia"},
                    {"code": "b", "text": "Cactos"},
                    {"code": "c", "text": "Climatologia"},
                    {"code": "d", "text": "Flores"},
                    {"code": "e", "text": "Rastreio de animais"}
                ]),

            # VIII. ARTE DE ACAMPAR
            req("pesquisador", "REGULAR", "VIII", "Arte de Acampar", "VIII.1", "Seis segredos de um bom acampamento e acampar cozinhando duas refeições",
                "Apresentar seis segredos para um bom acampamento. Participar de um acampamento de final de semana, planejando e cozinhando duas refeições.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "fogueira_cozinha"], "EQ-ACAMPAMENTO-PRATICO"),
            req("pesquisador", "REGULAR", "VIII", "Arte de Acampar", "VIII.2", "Especialidade de Acampamento III ou Primeiros Socorros – Básico",
                "Completar uma das seguintes especialidades:",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "primeiros_socorros"], "EQ-ESP-SOCORROS-RESGATE-SEGURANCA", "ESCOLHER_1", [
                    {"code": "a", "text": "Acampamento III"},
                    {"code": "b", "text": "Primeiros socorros – básico"}
                ]),
            req("pesquisador", "REGULAR", "VIII", "Arte de Acampar", "VIII.3", "Usar bússola ou GPS e encontrar endereços em zona urbana",
                "Aprender a usar uma bússola ou GPS (urbano ou de campo) e demonstrar sua habilidade encontrando endereços em uma zona urbana.",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "orientacao_bussola", "reuniao_clube"], "EQ-ORIENTACAO-PISTAS-CODIGOS"),

            # IX. ESTILO DE VIDA
            req("pesquisador", "REGULAR", "IX", "Estilo de Vida", "IX.1", "Completar uma nova especialidade em Artes e Habilidades Manuais",
                "Completar uma especialidade, não realizada anteriormente, em Artes e habilidades manuais.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ARTES-MANUAIS")
        ],
        "advanced_requirements": [
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.1", "Conhecer e usar a bandeira dos Desbravadores e o bandeirim de Unidade",
                "Conhecer e saber usar de forma adequada a bandeira dos Desbravadores e o bandeirim de Unidade.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "civismo_ordem_unida"], "EQ-CIVISMO-BANDEIRAS"),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.2", "Ler a história de J. N. Andrews ou pioneiro do país e discutir Mateus 28:18-20",
                "Ler a história de J. N. Andrews ou de um pioneiro do seu país e discutir a importância do trabalho missionário e por que Cristo ordenou a grande comissão (Mateus 28:18-20).",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "leitura", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.3", "Convidar uma pessoa para assistir ao Clube, Classe Bíblica ou Pequeno Grupo",
                "Convidar uma pessoa para assistir um dos seguintes programas:",
                "COMUNIDADE_E_MISSAO", "IGREJA", ["igreja", "reuniao_clube"], "EQ-MISSAO-EVANGELISMO", "ESCOLHER_1", [
                    {"code": "a", "text": "Clube de Desbravadores"},
                    {"code": "b", "text": "Classe Bíblica"},
                    {"code": "c", "text": "Pequeno Grupo"}
                ]),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.4", "Especialidade de Asseio e Cortesia Cristã ou Vida Familiar",
                "Fazer uma das seguintes especialidades:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS", "ESCOLHER_1", [
                    {"code": "a", "text": "Asseio e cortesia cristã"},
                    {"code": "b", "text": "Vida familiar"}
                ]),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.5", "Participar de caminhada de 10 km e listar equipamentos, roupa e calçado",
                "Participar de uma caminhada de 10 km e fazer uma lista dos equipamentos necessários, incluindo roupa e calçado que devem ser usados.",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "caminhada"], "EQ-CAMINHADA-EXCURSIONISMO"),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.6", "Participar na organização de evento especial (Investidura, Admissão em Lenço ou Dia Mundial)",
                "Participar na organização de um dos eventos especiais do Clube:",
                "LIDERANCA_E_IGREJA", "IGREJA", ["igreja", "reuniao_clube"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA", "ESCOLHER_1", [
                    {"code": "a", "text": "Investidura"},
                    {"code": "b", "text": "Admissão em lenço"},
                    {"code": "c", "text": "Dia Mundial do Desbravador"}
                ]),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.7", "Identificar 6 pegadas de animais/aves e fazer molde de 3 em gesso/massa/biscuit",
                "Identificar seis pegadas de animais ou aves. Fazer um modelo em gesso, massa de modelar ou biscuit de três dessas pegadas.",
                "NATUREZA_E_ECOLOGIA", "AR_LIVRE", ["ar_livre", "acampamento"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.8", "Fazer as 4 amarras básicas e construir um móvel de acampamento",
                "Aprender a fazer as quatro amarras básicas e construir um móvel de acampamento.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "nos_e_amarras"], "EQ-NOS-AMARRAS-PIONEIRIA"),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.9", "Planejar cardápio vegetariano para a Unidade para acampamento de 3 dias",
                "Planejar um cardápio vegetariano para sua Unidade para um acampamento de três dias e apresentá-lo ao seu instrutor.",
                "ACAMPAMENTO_E_PIONEIRIA", "REUNIAO_CLUBE", ["reuniao_clube", "acampamento", "fogueira_cozinha"], "EQ-FOGUEIRA-COZINHA"),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.10", "Enviar e receber mensagem em Semáforo, Código Morse, Libras ou Braille",
                "Enviar e receber uma mensagem através de uma das formas de comunicação abaixo:",
                "CAMINHADA_E_ORIENTACAO", "REUNIAO_CLUBE", ["reuniao_clube", "orientacao_bussola"], "EQ-ORIENTACAO-PISTAS-CODIGOS", "ESCOLHER_1", [
                    {"code": "a", "text": "Alfabeto com semáforos"},
                    {"code": "b", "text": "Código Morse com lanterna"},
                    {"code": "c", "text": "Alfabeto Libras (língua de sinais)"},
                    {"code": "d", "text": "Alfabeto Braille"}
                ]),
            req("pesquisador-avancado", "AVANCADA", "AV", "Pesquisador de Campo e Bosque", "AV.11", "Completar uma nova especialidade em Domésticas, Saúde, Missão ou Agrícola",
                "Completar uma especialidade, não realizada anteriormente, em uma das áreas abaixo:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS", "ESCOLHER_1", [
                    {"code": "a", "text": "Habilidades domésticas"},
                    {"code": "b", "text": "Ciência e saúde"},
                    {"code": "c", "text": "Atividades missionárias"},
                    {"code": "d", "text": "Atividades agrícolas"}
                ])
        ]
    },

    # =========================================================================
    # 4. PIONEIRO (13 ANOS) - REGULAR E AVANÇADA
    # =========================================================================
    {
        "slug": "pioneiro",
        "name": "Pioneiro",
        "advanced_slug": "pioneiro-avancado",
        "advanced_name": "Pioneiro de Novas Fronteiras",
        "min_age": 13,
        "color_name": "Cinza",
        "color_hex": "#4B5563",
        "logo_path": "/data/cartoes-oficiais/logos/logo_pioneiro.png",
        "official_url": "https://www.adventistas.org/pt/desbravadores/classes/pioneiro-e-pioneiro-de-novas-fronteiras/",
        "mda_wiki_url": "https://mda.wiki.br/Cartão_de_Pioneiro/",
        "focus": "Relacionamento com Jesus, criacionismo, mente e corpo de Deus, fazer sua parte no trabalho de Deus.",
        "regular_requirements": [
            # I. GERAIS
            req("pioneiro", "REGULAR", "I", "Gerais", "I.1", "Ter no mínimo 13 anos de idade",
                "Ter, no mínimo, 13 anos de idade.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("pioneiro", "REGULAR", "I", "Gerais", "I.2", "Ser membro ativo do Clube",
                "Ser membro ativo do Clube de Desbravadores.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("pioneiro", "REGULAR", "I", "Gerais", "I.3", "Memorizar e entender o Alvo e o Lema JA",
                "Memorizar e entender o Alvo e o Lema JA.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("pioneiro", "REGULAR", "I", "Gerais", "I.4", "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página",
                "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-CURSO-LEITURA"),
            req("pioneiro", "REGULAR", "I", "Gerais", "I.5", "Ler o livro 'Expedição Galápagos'",
                "Ler o livro Expedição Galápagos.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LIVRO-ESPECIFICO"),

            # II. DESCOBERTA ESPIRITUAL
            req("pioneiro", "REGULAR", "II", "Descoberta Espiritual", "II.1", "Memorizar e demonstrar conhecimento das Bem-Aventuranças (Sermão da Montanha)",
                "Memorizar e demonstrar o seu conhecimento: a) Bem-Aventuranças: o sermão da montanha.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("pioneiro", "REGULAR", "II", "Descoberta Espiritual", "II.2", "Ler e explicar versos bíblicos (Is 26:3, Rm 12:12, Jo 14:1-3, Sl 37:5, Fp 3:12-14, Salmo 23, I Sm 15:22)",
                "Ler e explicar os versos abaixo:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "Isaías 26:3"},
                    {"code": "b", "text": "Romanos 12:12"},
                    {"code": "c", "text": "João 14:1-3"},
                    {"code": "d", "text": "Salmo 37:5"},
                    {"code": "e", "text": "Filipenses 3:12-14"},
                    {"code": "f", "text": "Salmo 23"},
                    {"code": "g", "text": "I Samuel 15:22"}
                ]),
            req("pioneiro", "REGULAR", "II", "Descoberta Espiritual", "II.3", "Conversar sobre cristianismo e verdadeiro discipulado",
                "Conversar em seu Clube ou Unidade sobre:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "O que é o cristianismo"},
                    {"code": "b", "text": "Quais são as características de um verdadeiro discípulo"},
                    {"code": "c", "text": "O que fazer para ser um cristão verdadeiro"}
                ]),
            req("pioneiro", "REGULAR", "II", "Descoberta Espiritual", "II.4", "Estudo especial sobre inspiração da Bíblia (inspiração, revelação e iluminação) com pastor",
                "Participar de um estudo especial sobre a inspiração da Bíblia, com a ajuda de um pastor, trabalhando os conceitos de inspiração, revelação e iluminação.",
                "ESPIRITUAL_E_BIBLIA", "IGREJA", ["igreja", "reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("pioneiro", "REGULAR", "II", "Descoberta Espiritual", "II.5", "Convidar 3 ou mais pessoas para assistirem a uma Classe Bíblica ou Pequeno Grupo",
                "Convidar três ou mais pessoas para assistirem a uma Classe Bíblica ou Pequeno Grupo.",
                "COMUNIDADE_E_MISSAO", "IGREJA", ["igreja", "comunidade"], "EQ-MISSAO-EVANGELISMO"),
            req("pioneiro", "REGULAR", "II", "Descoberta Espiritual", "II.6", "Leitura Bíblica (Eclesiastes a Mateus 23 selecionados)",
                "Leitura bíblica: Ec 3, 5, 7, 11 e 12, Is 5, 11, 26:1-12, 35, 40, 43, 52:13-15, 53, 58, 60, 61, Jr 9:23-26, 10:1-16, 18:1-6, 26, 36, 52:1-11, Dn 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, Jl 2:12-31, Am 7:10-16, 8:4-11, Jn 1, 2, 3 e 4, Mq 4, Ag 2, Zc 4, Ml 3 e 4, Mt 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23.",
                "ESPIRITUAL_E_BIBLIA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LEITURA-BIBLICA"),

            # III. SERVINDO A OUTROS
            req("pioneiro", "REGULAR", "III", "Servindo a Outros", "III.1", "Participar em dois projetos missionários definidos pelo Clube",
                "Participar em dois projetos missionários definidos por seu Clube.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade", "igreja"], "EQ-MISSAO-EVANGELISMO"),
            req("pioneiro", "REGULAR", "III", "Servindo a Outros", "III.2", "Trabalhar em um projeto comunitário da igreja, escola ou comunidade",
                "Trabalhar em um projeto comunitário de sua igreja, escola ou comunidade.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade"], "EQ-PROJETO-COMUNITARIO"),

            # IV. DESENVOLVENDO AMIZADE
            req("pioneiro", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.1", "Debate e avaliação pessoal sobre Autoestima, Amizade, Relacionamentos ou Otimismo",
                "Participar de um debate e fazer uma avaliação pessoal sobre suas atitudes em dois dos seguintes temas:",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO", "ESCOLHER_2", [
                    {"code": "a", "text": "Autoestima"},
                    {"code": "b", "text": "Amizade"},
                    {"code": "c", "text": "Relacionamentos"},
                    {"code": "d", "text": "Otimismo e pessimismo"}
                ]),

            # V. SAÚDE E APTIDÃO FÍSICA
            req("pioneiro", "REGULAR", "V", "Saúde e Aptidão Física", "V.1", "Preparar programa pessoal de exercícios físicos diários e assinar compromisso",
                "Preparar um programa pessoal de exercícios físicos diários e conversar com seu líder ou conselheiro sobre os princípios de aptidão física. Fazer e assinar um compromisso pessoal de realizar exercícios físicos regularmente.",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "em_casa"], "EQ-TEMPERANCA-SAUDE"),
            req("pioneiro", "REGULAR", "V", "Saúde e Aptidão Física", "V.2", "Discutir as vantagens do estilo de vida adventista segundo a Bíblia",
                "Discutir as vantagens do estilo de vida adventista de acordo com o que a Bíblia ensina.",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-TEMPERANCA-SAUDE"),

            # VI. ORGANIZAÇÃO E LIDERANÇA
            req("pioneiro", "REGULAR", "VI", "Organização e Liderança", "VI.1", "Assistir a um seminário ou treinamento de Ministério Pessoal ou Evangelismo",
                "Assistir a um seminário ou treinamento oferecido pela sua igreja ou distrito nos departamentos abaixo:",
                "LIDERANCA_E_IGREJA", "IGREJA", ["igreja", "debate_apresentacao"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA", "ESCOLHER_1", [
                    {"code": "a", "text": "Ministério Pessoal"},
                    {"code": "b", "text": "Evangelismo"}
                ]),
            req("pioneiro", "REGULAR", "VI", "Organização e Liderança", "VI.2", "Participar de uma atividade social de sua igreja",
                "Participar de uma atividade social de sua igreja.",
                "LIDERANCA_E_IGREJA", "IGREJA", ["igreja"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),

            # VII. ESTUDO DA NATUREZA
            req("pioneiro", "REGULAR", "VII", "Estudo da Natureza", "VII.1", "Estudar a história do Dilúvio e o processo de fossilização",
                "Estudar a história do dilúvio e o processo de fossilização.",
                "NATUREZA_E_ECOLOGIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("pioneiro", "REGULAR", "VII", "Estudo da Natureza", "VII.2", "Completar uma nova especialidade em Estudo da Natureza",
                "Completar uma especialidade não realizada anteriormente em Estudo da natureza.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube", "ar_livre"], "EQ-ESP-NATUREZA-ECOLOGIA"),

            # VIII. ARTE DE ACAMPAR
            req("pioneiro", "REGULAR", "VIII", "Arte de Acampar", "VIII.1", "Fazer um fogo refletor e demonstrar seu uso",
                "Fazer um fogo refletor e demonstrar seu uso.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "fogueira_cozinha"], "EQ-FOGUEIRA-COZINHA"),
            req("pioneiro", "REGULAR", "VIII", "Arte de Acampar", "VIII.2", "Participar de acampamento de fim de semana arrumando adequadamente a mochila",
                "Participar de um acampamento de final de semana, arrumando de forma apropriada sua bolsa ou mochila com o equipamento pessoal necessário.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre"], "EQ-ACAMPAMENTO-PRATICO"),
            req("pioneiro", "REGULAR", "VIII", "Arte de Acampar", "VIII.3", "Completar a especialidade de Resgate Básico",
                "Completar a especialidade de Resgate básico.",
                "ESPECIALIDADES", "AR_LIVRE", ["especialidade", "ar_livre", "primeiros_socorros"], "EQ-ESP-SOCORROS-RESGATE-SEGURANCA"),

            # IX. ESTILO DE VIDA
            req("pioneiro", "REGULAR", "IX", "Estilo de Vida", "IX.1", "Completar uma nova especialidade em Missão, Profissional ou Agrícola",
                "Completar uma especialidade não realizada anteriormente em uma das seguintes áreas:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS", "ESCOLHER_1", [
                    {"code": "a", "text": "Atividades missionárias e comunitárias"},
                    {"code": "b", "text": "Atividades profissionais"},
                    {"code": "c", "text": "Atividades agrícolas e afins"}
                ])
        ],
        "advanced_requirements": [
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.1", "Completar a especialidade de Cidadania Cristã",
                "Completar a especialidade de Cidadania cristã, caso não tenha sido realizada anteriormente.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube", "civismo_ordem_unida"], "EQ-CIVISMO-BANDEIRAS"),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.2", "Encenar a história do Bom Samaritano e auxiliar 3 ou mais pessoas",
                "Encenar a história do bom samaritano, demonstrando como ajudar as pessoas e auxiliar de forma prática três pessoas ou mais.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade", "reuniao_clube", "debate_apresentacao"], "EQ-PROJETO-COMUNITARIO"),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.3", "Atividade física ao ar livre (Caminhar 10km, Ciclismo 15km, Canoa, Natação, etc.) com relatório de 2 páginas",
                "Participar de uma das seguintes atividades, apresentando ao final um relatório escrito contendo, no mínimo, duas páginas:",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "caminhada"], "EQ-CAMINHADA-EXCURSIONISMO", "ESCOLHER_1", [
                    {"code": "a", "text": "Caminhar 10 km"},
                    {"code": "b", "text": "Cavalgar 2 km"},
                    {"code": "c", "text": "Viajar de canoa durante 2 horas"},
                    {"code": "d", "text": "Praticar 15 km de ciclismo"},
                    {"code": "e", "text": "Nadar 200 metros"},
                    {"code": "f", "text": "Correr 1500 metros"},
                    {"code": "g", "text": "Rodar 2 km de patins ou roller"}
                ]),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.4", "Completar a especialidade de Mapa e Bússola",
                "Completar a especialidade de Mapa e bússola.",
                "ESPECIALIDADES", "AR_LIVRE", ["especialidade", "ar_livre", "orientacao_bussola"], "EQ-ORIENTACAO-PISTAS-CODIGOS"),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.5", "Demonstrar habilidade no uso correto de uma machadinha",
                "Demonstrar habilidade no uso correto de uma machadinha.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "primeiros_socorros"], "EQ-FERRAMENTAS-CORTE"),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.6", "Acender uma fogueira em dia de chuva, conseguir lenha seca e manter o fogo aceso",
                "Ser capaz de acender uma fogueira em dia de chuva, saber como conseguir lenha seca e manter o fogo aceso.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "fogueira_cozinha"], "EQ-FOGUEIRA-COZINHA"),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.7", "Plantas silvestres comestíveis ou códigos avançados (Semáforo, Náutico, Libras Mt 24 ou Braille Sl 23)",
                "Completar um dos seguintes itens:",
                "CAMINHADA_E_ORIENTACAO", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre", "orientacao_bussola"], "EQ-ORIENTACAO-PISTAS-CODIGOS", "ESCOLHER_1", [
                    {"code": "a", "text": "Pesquisar e identificar 10 variedades de plantas silvestres comestíveis."},
                    {"code": "b", "text": "Ser capaz de enviar e receber 35 letras por minuto pelo código semafórico."},
                    {"code": "c", "text": "Ser capaz de enviar e receber 35 letras por minuto através do código náutico, usando o código internacional."},
                    {"code": "d", "text": "Ser capaz de apresentar e entender Mateus 24 em Libras (língua de sinais)."},
                    {"code": "e", "text": "Preparar o Salmo 23 em braille."}
                ]),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.8", "Completar uma nova especialidade em Atividades Recreativas",
                "Completar uma especialidade, não realizada anteriormente, em Atividades recreativas.",
                "ESPECIALIDADES", "AR_LIVRE", ["especialidade", "ar_livre", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS"),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.9", "Pesquisar e identificar 25 itens da natureza (folhas, rochas, flores, borboletas ou conchas)",
                "Pesquisar e identificar, através de fotografia, exposição ou ao vivo, um dos seguintes itens:",
                "NATUREZA_E_ECOLOGIA", "AR_LIVRE", ["ar_livre", "em_casa"], "EQ-IDENTIFICACAO-NATUREZA", "ESCOLHER_1", [
                    {"code": "a", "text": "25 folhas de árvores"},
                    {"code": "b", "text": "25 rochas e minerais"},
                    {"code": "c", "text": "25 flores silvestres"},
                    {"code": "d", "text": "25 borboletas e mariposas"},
                    {"code": "e", "text": "25 conchas"}
                ]),
            req("pioneiro-avancado", "AVANCADA", "AV", "Pioneiro de Novas Fronteiras", "AV.10", "Completar a especialidade de Fogueiras e Cozinha ao Ar Livre",
                "Completar a especialidade de Fogueiras e cozinha ao ar livre.",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre", "fogueira_cozinha"], "EQ-ESP-ACAMPAMENTO-ARTE")
        ]
    },

    # =========================================================================
    # 5. EXCURSIONISTA (14 ANOS) - REGULAR E AVANÇADA
    # =========================================================================
    {
        "slug": "excursionista",
        "name": "Excursionista",
        "advanced_slug": "excursionista-avancado",
        "advanced_name": "Excursionista na Mata",
        "min_age": 14,
        "color_name": "Roxo / Vinho",
        "color_hex": "#7E22CE",
        "logo_path": "/data/cartoes-oficiais/logos/logo_excursionista.png",
        "official_url": "https://www.adventistas.org/pt/desbravadores/classes/excursionista-e-excursionista-na-mata/",
        "mda_wiki_url": "https://mda.wiki.br/Cartão_de_Excursionista/",
        "focus": "Doutrinas (Sábado, Espírito Santo e Volta de Jesus), voto de abstinência, forte envolvimento com a natureza e utilidade social.",
        "regular_requirements": [
            # I. GERAIS
            req("excursionista", "REGULAR", "I", "Gerais", "I.1", "Ter no mínimo 14 anos de idade",
                "Ter, no mínimo, 14 anos de idade.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("excursionista", "REGULAR", "I", "Gerais", "I.2", "Ser membro ativo do Clube",
                "Ser membro ativo do Clube de Desbravadores.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("excursionista", "REGULAR", "I", "Gerais", "I.3", "Memorizar e explicar o significado do Objetivo JA",
                "Memorizar e explicar o significado do Objetivo JA.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("excursionista", "REGULAR", "I", "Gerais", "I.4", "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página",
                "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-CURSO-LEITURA"),
            req("excursionista", "REGULAR", "I", "Gerais", "I.5", "Ler o livro 'O Fim do Começo'",
                "Ler o livro O fim do começo.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LIVRO-ESPECIFICO"),

            # II. DESCOBERTA ESPIRITUAL
            req("excursionista", "REGULAR", "II", "Descoberta Espiritual", "II.1", "Memorizar o nome dos 12 Apóstolos e o Fruto do Espírito",
                "Memorizar e demonstrar o seu conhecimento:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "Apóstolos: O nome dos 12 apóstolos de Cristo."},
                    {"code": "b", "text": "Fruto do Espírito: A relação de adjetivos do caráter do cristão."}
                ]),
            req("excursionista", "REGULAR", "II", "Descoberta Espiritual", "II.2", "Ler e explicar versos bíblicos (Rm 8:28, Ap 21:1-3, II Pe 1:20-21, I Jo 2:14, II Cr 20:20, Salmo 46)",
                "Ler e explicar os versos abaixo:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "Romanos 8:28"},
                    {"code": "b", "text": "Apocalipse 21:1-3"},
                    {"code": "c", "text": "II Pedro 1:20-21"},
                    {"code": "d", "text": "I João 2:14"},
                    {"code": "e", "text": "II Crônicas 20:20"},
                    {"code": "f", "text": "Salmo 46"}
                ]),
            req("excursionista", "REGULAR", "II", "Descoberta Espiritual", "II.3", "Estudar e entender a pessoa e o papel do Espírito Santo",
                "Estudar e entender a pessoa do Espírito Santo, como Ele se relaciona, e qual o Seu papel no crescimento espiritual de cada ser humano.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("excursionista", "REGULAR", "II", "Descoberta Espiritual", "II.4", "Estudar com a Unidade os eventos finais e a segunda vinda de Cristo",
                "Estudar, com sua Unidade, os eventos finais e a segunda vinda de Cristo.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("excursionista", "REGULAR", "II", "Descoberta Espiritual", "II.5", "Descobrir pelo estudo da Bíblia o verdadeiro significado da observância do Sábado",
                "Através do estudo da Bíblia, descobrir o verdadeiro significado da observância do sábado.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja"], "EQ-MEMORIZACAO-BIBLICA"),
            req("excursionista", "REGULAR", "II", "Descoberta Espiritual", "II.6", "Leitura Bíblica (Mateus 24 a Atos 8 selecionados)",
                "Leitura bíblica: Mt 24, 25, 26:1-35, 26:36-75, 27:1-31, 27:32-56, 27:57-66, 28, Mc 7, 9, 10, 11, 12, 16, Lc 1:4-25, 1:26-66, 2:21-38, 2:39-52, 7:18-28, 8, 10:1-37, 10:38-42, 11:1-13, 12, 13, 14, 15, 16:1-17, 17, 18, 19, 21, 22, 23, 24, Jo 1, 2, 3, 4, 5, 6:1-21, 6:22-71, 8:1-38, 9, 10, 11:1-46, 12, 13, 14, 15, 17, 18, 19, 20, 21, At 1, 2, 3, 4, 5, 6, 7, 8.",
                "ESPIRITUAL_E_BIBLIA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LEITURA-BIBLICA"),

            # III. SERVINDO A OUTROS
            req("excursionista", "REGULAR", "III", "Servindo a Outros", "III.1", "Convidar um amigo para participar de uma atividade social da igreja ou Associação/Missão",
                "Convidar um amigo para participar de uma atividade social de sua igreja ou da Associação/Missão.",
                "COMUNIDADE_E_MISSAO", "IGREJA", ["igreja"], "EQ-MISSAO-EVANGELISMO"),
            req("excursionista", "REGULAR", "III", "Servindo a Outros", "III.2", "Participar de um projeto comunitário desde o planejamento até a execução",
                "Participar de um projeto comunitário desde o planejamento, organização até a execução.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade"], "EQ-PROJETO-COMUNITARIO"),
            req("excursionista", "REGULAR", "III", "Servindo a Outros", "III.3", "Discutir o relacionamento dos jovens adventistas no dia a dia (Vizinhos, Escola, Social, Recreação)",
                "Discutir como os jovens adventistas devem se relacionar com as pessoas nas diferentes situações do dia a dia, tais como:",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO", "TODOS", [
                    {"code": "a", "text": "Vizinhos"},
                    {"code": "b", "text": "Escola"},
                    {"code": "c", "text": "Atividades sociais"},
                    {"code": "d", "text": "Atividades recreativas"}
                ]),

            # IV. DESENVOLVENDO AMIZADE
            req("excursionista", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.1", "Examinar atitudes em 2 temas (Autoestima, Família, Finanças Pessoais ou Pressão de Grupo)",
                "Através de uma conversa em grupo ou avaliação pessoal, examinar suas atitudes em dois dos seguintes temas:",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO", "ESCOLHER_2", [
                    {"code": "a", "text": "Autoestima"},
                    {"code": "b", "text": "Relacionamento familiar"},
                    {"code": "c", "text": "Finanças pessoais"},
                    {"code": "d", "text": "Pressão de grupo"}
                ]),
            req("excursionista", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.2", "Listar 5 sugestões de atividades recreativas para pessoas com necessidades específicas e colaborar em uma",
                "Preparar uma lista contendo cinco sugestões de atividades recreativas para ajudar pessoas com necessidades específicas e colaborar na organização de uma dessas atividades para essas pessoas.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade", "reuniao_clube"], "EQ-PROJETO-COMUNITARIO"),

            # V. SAÚDE E APTIDÃO FÍSICA
            req("excursionista", "REGULAR", "V", "Saúde e Aptidão Física", "V.1", "Completar a especialidade de Temperança",
                "Completar a especialidade de Temperança.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-TEMPERANCA-SAUDE"),

            # VI. ORGANIZAÇÃO E LIDERANÇA
            req("excursionista", "REGULAR", "VI", "Organização e Liderança", "VI.1", "Preparar organograma da igreja local e relacionar funções dos departamentos",
                "Preparar um organograma da igreja local e relacionar as funções dos departamentos.",
                "LIDERANCA_E_IGREJA", "IGREJA", ["igreja", "reuniao_clube"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),
            req("excursionista", "REGULAR", "VI", "Organização e Liderança", "VI.2", "Participar de dois programas envolvendo diferentes departamentos da igreja local",
                "Participar de dois programas envolvendo diferentes departamentos da igreja local.",
                "LIDERANCA_E_IGREJA", "IGREJA", ["igreja"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),
            req("excursionista", "REGULAR", "VI", "Organização e Liderança", "VI.3", "Completar a especialidade de Aventuras com Cristo",
                "Completar a especialidade de Aventuras com Cristo.",
                "ESPECIALIDADES", "IGREJA", ["especialidade", "igreja", "comunidade"], "EQ-MISSAO-EVANGELISMO"),

            # VII. ESTUDO DA NATUREZA
            req("excursionista", "REGULAR", "VII", "Estudo da Natureza", "VII.1", "Recapitular a história de Nicodemos e relacioná-la com o ciclo da lagarta/borboleta",
                "Recapitular a história de Nicodemos e relacioná-la com o ciclo de vida da lagarta ou borboleta, acrescentando um significado espiritual.",
                "NATUREZA_E_ECOLOGIA", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("excursionista", "REGULAR", "VII", "Estudo da Natureza", "VII.2", "Completar uma nova especialidade em Estudo da Natureza",
                "Completar uma especialidade em Estudo da natureza, não realizada anteriormente.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube", "ar_livre"], "EQ-ESP-NATUREZA-ECOLOGIA"),

            # VIII. ARTE DE ACAMPAR
            req("excursionista", "REGULAR", "VIII", "Arte de Acampar", "VIII.1", "Expedição/Caminhada de 20 km em área rural com pernoite e anotações de flora/fauna/terreno",
                "Com um grupo de, no mínimo, quatro pessoas e com a presença de um conselheiro adulto e experiente, andar pelo menos 20 km numa área rural ou deserta, incluindo uma noite ao ar livre ou em barraca. Planejar a expedição em detalhes antes da saída. Durante a caminhada, efetuar anotações sobre o terreno, flora e fauna observados. Depois, usando as anotações, participar de uma discussão em grupo, dirigida por seu conselheiro.",
                "CAMINHADA_E_ORIENTACAO", "ACAMPAMENTO", ["acampamento", "ar_livre", "caminhada"], "EQ-CAMINHADA-EXCURSIONISMO"),
            req("excursionista", "REGULAR", "VIII", "Arte de Acampar", "VIII.2", "Completar a especialidade de Pioneirias",
                "Completar a especialidade de Pioneirias.",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre", "nos_e_amarras"], "EQ-NOS-AMARRAS-PIONEIRIA"),

            # IX. ESTILO DE VIDA
            req("excursionista", "REGULAR", "IX", "Estilo de Vida", "IX.1", "Completar uma nova especialidade em Missão, Agrícola, Saúde ou Doméstica",
                "Completar uma especialidade não realizada anteriormente em uma das seguintes áreas:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS", "ESCOLHER_1", [
                    {"code": "a", "text": "Atividades missionárias e comunitárias"},
                    {"code": "b", "text": "Atividades agrícolas e afins"},
                    {"code": "c", "text": "Ciência e saúde"},
                    {"code": "d", "text": "Habilidades domésticas"}
                ])
        ],
        "advanced_requirements": [
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.1", "Apresentação sobre respeito à Lei de Deus e autoridades civis (10 princípios morais)",
                "Fazer uma apresentação escrita ou falada sobre o respeito que devemos ter com a Lei de Deus e as autoridades civis, enumerando 10 princípios de comportamento moral.",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao", "civismo_ordem_unida"], "EQ-CIVISMO-BANDEIRAS"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.2", "Acompanhar o pastor ou ancião numa visita missionária ou estudo bíblico",
                "Acompanhar seu pastor ou ancião numa visita missionária ou estudo bíblico.",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade", "igreja"], "EQ-MISSAO-EVANGELISMO"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.3", "Completar a especialidade de Testemunho Juvenil",
                "Completar a especialidade de Testemunho juvenil.",
                "ESPECIALIDADES", "IGREJA", ["especialidade", "igreja", "comunidade"], "EQ-MISSAO-EVANGELISMO"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.4", "Apresentar cinco atividades na natureza para serem realizadas no sábado à tarde",
                "Apresentar cinco atividades na natureza, para serem realizadas no sábado à tarde.",
                "NATUREZA_E_ECOLOGIA", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre", "igreja"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.5", "Construir com a Unidade um móvel de acampamento e um portal para o Clube",
                "Com sua Unidade, construir um móvel de acampamento e um portal para o Clube.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "nos_e_amarras"], "EQ-NOS-AMARRAS-PIONEIRIA"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.6", "Conversar em Unidade/Clube sobre Modéstia Cristã, Recreação, Saúde ou Sábado",
                "Através da supervisão de seu líder ou conselheiro, conversar em sua Unidade ou Clube sobre um dos seguintes temas:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-TEMPERANCA-SAUDE", "ESCOLHER_1", [
                    {"code": "a", "text": "Modéstia cristã"},
                    {"code": "b", "text": "Recreação"},
                    {"code": "c", "text": "Saúde"},
                    {"code": "d", "text": "Observância do sábado"}
                ]),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.7", "Identificar plantas silvestres comestíveis e diferenciá-las de plantas tóxicas/venenosas",
                "Demonstrar conhecimento para encontrar alimentos através de plantas silvestres de sua região e saber diferenciá-las de plantas tóxicas/venenosas.",
                "NATUREZA_E_ECOLOGIA", "AR_LIVRE", ["ar_livre", "acampamento"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.8", "Procedimentos em caso de ferimentos por animais peçonhentos e não peçonhentos",
                "Demonstrar conhecimento quanto aos procedimentos necessários em caso de ferimentos por diferentes animais peçonhentos e não peçonhentos.",
                "ACAMPAMENTO_E_PIONEIRIA", "REUNIAO_CLUBE", ["reuniao_clube", "acampamento", "primeiros_socorros"], "EQ-ESP-SOCORROS-RESGATE-SEGURANCA"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.9", "Demonstrar técnicas para percorrer trilhas em desertos, florestas, pântanos e rios",
                "Demonstrar técnicas para percorrer trilhas em diferentes tipos de terrenos, como: desertos, florestas, pântanos e rios.",
                "CAMINHADA_E_ORIENTACAO", "AR_LIVRE", ["ar_livre", "caminhada", "acampamento"], "EQ-CAMINHADA-EXCURSIONISMO"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.10", "Completar a especialidade de Ordem Unida",
                "Completar a especialidade de Ordem unida.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube", "civismo_ordem_unida"], "EQ-CIVISMO-BANDEIRAS"),
            req("excursionista-avancado", "AVANCADA", "AV", "Excursionista na Mata", "AV.11", "Completar a especialidade de Vida Silvestre",
                "Completar a especialidade de Vida silvestre.",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre"], "EQ-ESP-ACAMPAMENTO-ARTE")
        ]
    },

    # =========================================================================
    # 6. GUIA (15 ANOS) - REGULAR E AVANÇADA
    # =========================================================================
    {
        "slug": "guia",
        "name": "Guia",
        "advanced_slug": "guia-avancado",
        "advanced_name": "Guia de Exploração",
        "min_age": 15,
        "color_name": "Amarelo",
        "color_hex": "#EAB308",
        "logo_path": "/data/cartoes-oficiais/logos/logo_guia.png",
        "official_url": "https://www.adventistas.org/pt/desbravadores/classes/guia-e-guia-de-exploracao/",
        "mda_wiki_url": "https://mda.wiki.br/Cartão_de_Guia/",
        "focus": "Doutrinas (Santuário, Mordomia, Discipulado), temperança, dons espirituais e desenvolvimento de habilidades de liderança.",
        "regular_requirements": [
            # I. GERAIS
            req("guia", "REGULAR", "I", "Gerais", "I.1", "Ter no mínimo 15 anos de idade",
                "Ter, no mínimo, 15 anos de idade.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("guia", "REGULAR", "I", "Gerais", "I.2", "Ser membro ativo do Clube",
                "Ser membro ativo do Clube de Desbravadores.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube"], "EQ-MEMBRO-ATIVO"),
            req("guia", "REGULAR", "I", "Gerais", "I.3", "Memorizar e explicar o Voto de Fidelidade à Bíblia",
                "Memorizar e explicar o Voto de Fidelidade à Bíblia.",
                "IDEAIS_E_LEITURA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-IDEAIS-MEMORIZACAO"),
            req("guia", "REGULAR", "I", "Gerais", "I.4", "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página",
                "Ler o livro do Curso de Leitura do ano e resumi-lo em uma página.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-CURSO-LEITURA"),
            req("guia", "REGULAR", "I", "Gerais", "I.5", "Ler o livro 'O Livro Amargo'",
                "Ler o livro O livro amargo.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LIVRO-ESPECIFICO"),

            # II. DESCOBERTA ESPIRITUAL
            req("guia", "REGULAR", "II", "Descoberta Espiritual", "II.1", "Memorizar as 3 Mensagens Angélicas, 7 Igrejas e 12 Pedras Preciosas da Nova Jerusalém",
                "Memorizar e demonstrar o seu conhecimento:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "3 Mensagens Angélicas: Reveladas em Apocalipse 14:6-12"},
                    {"code": "b", "text": "7 Igrejas: O nome das igrejas do Apocalipse"},
                    {"code": "c", "text": "Pedras preciosas: Os 12 fundamentos da Cidade Santa – A Nova Jerusalém"}
                ]),
            req("guia", "REGULAR", "II", "Descoberta Espiritual", "II.2", "Ler e explicar versos bíblicos (I Co 13, II Cr 7:14, Ap 22:18-20, II Tm 4:6-7, Rm 8:38-39, Mt 6:33-34)",
                "Ler e explicar os versos abaixo:",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "memorizacao"], "EQ-MEMORIZACAO-BIBLICA", "TODOS", [
                    {"code": "a", "text": "I Coríntios 13"},
                    {"code": "b", "text": "II Crônicas 7:14"},
                    {"code": "c", "text": "Apocalipse 22:18-20"},
                    {"code": "d", "text": "II Timóteo 4:6-7"},
                    {"code": "e", "text": "Romanos 8:38-39"},
                    {"code": "f", "text": "Mateus 6:33-34"}
                ]),
            req("guia", "REGULAR", "II", "Descoberta Espiritual", "II.3", "Descrever os dons espirituais nos escritos de Paulo e seus objetivos na igreja",
                "Descrever os dons espirituais mencionados nos escritos de Paulo (Coríntios, Efésios, Filipenses) e para quais objetivos a igreja recebe esses dons.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("guia", "REGULAR", "II", "Descoberta Espiritual", "II.4", "Estudar a estrutura e serviço do Santuário e relacionar com o ministério de Jesus",
                "Estudar a estrutura e serviço do santuário no Antigo Testamento e relacionar com o ministério pessoal de Jesus e a cruz.",
                "ESPIRITUAL_E_BIBLIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MEMORIZACAO-BIBLICA"),
            req("guia", "REGULAR", "II", "Descoberta Espiritual", "II.5", "Ler e resumir três histórias de pioneiros adventistas e contá-las no Clube/JA/Escola Sabatina",
                "Ler e resumir três histórias de pioneiros adventistas. Contar essas histórias na reunião do Clube, no culto JA ou na Escola Sabatina.",
                "ESPIRITUAL_E_BIBLIA", "IGREJA", ["igreja", "reuniao_clube", "leitura", "debate_apresentacao"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),
            req("guia", "REGULAR", "II", "Descoberta Espiritual", "II.6", "Leitura Bíblica (Atos 9 a Apocalipse 21 selecionados)",
                "Leitura bíblica: At 9:1-31, 9:32-43, 10, 11, 12, 13, 14, 16, 17:1-15, 17:16-34, 18, 19:1-22, 19:23-41, 20, 21:17-40, 22:1-16, 23, 24, 25, 26, 27, 28, Rm 12, 13, 14, 1 Co 13, 2 Co 5:11-21, Co 11:16-33, 12:1-10, Gl 5:16-26, 6:1-10, Ef 5:1-21, 6, Fp 4, Cl 3, 1 Ts 4:13-18, 5, 2 Ts 2, 3, 1 Tm 4:6-16, Tm 5:1-16, 6:11-21, 2 Tm 2, 3, Fm, Hb 11, Tg 1, 3, 5:7-20, 1 Pe 1, 5:1-11, 2 Pe 3, 1 Jo 2, 3, 4, 5, Jd 17-25, Ap 1, 2, 3, 7:9-17, 12, 13, 14, 19, 20, 21.",
                "ESPIRITUAL_E_BIBLIA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LEITURA-BIBLICA"),

            # III. SERVINDO A OUTROS
            req("guia", "REGULAR", "III", "Servindo a Outros", "III.1", "Organizar e participar de visita a doente, adoção solidária de família ou projeto aprovado",
                "Ajudar a organizar e participar de uma das seguintes atividades:",
                "COMUNIDADE_E_MISSAO", "COMUNIDADE", ["comunidade"], "EQ-PROJETO-COMUNITARIO", "ESCOLHER_1", [
                    {"code": "a", "text": "Fazer uma visita de cortesia a uma pessoa doente"},
                    {"code": "b", "text": "Adotar uma pessoa ou família em necessidade e ajudá-los"},
                    {"code": "c", "text": "Um projeto de sua escolha aprovado por seu líder"}
                ]),
            req("guia", "REGULAR", "III", "Servindo a Outros", "III.2", "Discutir métodos de evangelismo pessoal com a Unidade e colocar princípios em prática",
                "Discutir com sua Unidade os métodos de evangelismo pessoal e colocar alguns princípios em prática.",
                "COMUNIDADE_E_MISSAO", "IGREJA", ["igreja", "comunidade", "reuniao_clube"], "EQ-MISSAO-EVANGELISMO"),

            # IV. DESENVOLVENDO AMIZADE
            req("guia", "REGULAR", "IV", "Desenvolvendo Amizade", "IV.1", "Assistir a palestra/aula e examinar atitudes em 2 temas (Profissão, Pais, Namoro ou Sexo)",
                "Assistir a uma palestra ou aula e examinar suas atitudes em relação a dois dos seguintes temas:",
                "AMIZADE_E_CIDADANIA", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-IDEAIS-MEMORIZACAO", "ESCOLHER_2", [
                    {"code": "a", "text": "A importância da escolha profissional"},
                    {"code": "b", "text": "Como se relacionar com os pais"},
                    {"code": "c", "text": "A escolha da pessoa certa para namorar"},
                    {"code": "d", "text": "O plano de Deus para o sexo"}
                ]),

            # V. SAÚDE E APTIDÃO FÍSICA
            req("guia", "REGULAR", "V", "Saúde e Aptidão Física", "V.1", "Fazer uma apresentação sobre os 8 remédios naturais dados por Deus",
                "Fazer uma apresentação, para o seu Clube ou Unidade, sobre os oito remédios naturais dados por Deus.",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-TEMPERANCA-SAUDE"),
            req("guia", "REGULAR", "V", "Saúde e Aptidão Física", "V.2", "Completar atividade de Saúde (Artigo, Corrida com treino, Leitura Temperança ou Esp. Nutrição/Cultura Física)",
                "Completar uma das seguintes atividades:",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "ar_livre", "especialidade"], "EQ-TEMPERANCA-SAUDE", "ESCOLHER_1", [
                    {"code": "a", "text": "Escrever uma poesia ou artigo sobre saúde para ser divulgado em uma revista, boletim ou jornal da igreja"},
                    {"code": "b", "text": "Individualmente ou em grupo, organizar e participar de uma corrida ou atividade similar e apresentar com antecedência um programa de treinamento físico para este evento"},
                    {"code": "c", "text": "Ler as páginas 102-125 do livro Temperança, de Ellen White, e apresentar em uma página ou mais, 10 textos selecionados da leitura"},
                    {"code": "d", "text": "Completar a especialidade de Nutrição ou liderar um grupo para a especialidade de Cultura física"}
                ]),

            # VI. ORGANIZAÇÃO E LIDERANÇA
            req("guia", "REGULAR", "VI", "Organização e Liderança", "VI.1", "Preparar organograma da estrutura administrativa da Igreja Adventista na Divisão",
                "Preparar um organograma da estrutura administrativa da Igreja Adventista em sua Divisão.",
                "LIDERANCA_E_IGREJA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),
            req("guia", "REGULAR", "VI", "Organização e Liderança", "VI.2", "Participar de Curso de Conselheiros, Convenção de Liderança ou 2 reuniões de diretoria",
                "Participar em um dos itens abaixo:",
                "LIDERANCA_E_IGREJA", "REUNIAO_CLUBE", ["reuniao_clube", "igreja"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA", "ESCOLHER_1", [
                    {"code": "a", "text": "Curso para conselheiros"},
                    {"code": "b", "text": "Convenção de liderança da Associação/Missão"},
                    {"code": "c", "text": "Duas reuniões de diretoria do seu Clube"}
                ]),
            req("guia", "REGULAR", "VI", "Organização e Liderança", "VI.3", "Planejar e ensinar no mínimo 2 requisitos de uma especialidade para um grupo/Unidade",
                "Planejar e ensinar, no mínimo, dois requisitos de uma especialidade para um grupo ou Unidade de Desbravadores.",
                "LIDERANCA_E_IGREJA", "REUNIAO_CLUBE", ["reuniao_clube", "especialidade", "debate_apresentacao"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA"),

            # VII. ESTUDO DA NATUREZA
            req("guia", "REGULAR", "VII", "Estudo da Natureza", "VII.1", "Ler o cap. 7 de 'O Desejado de Todas as Nações' e apresentar lições da natureza na infância de Jesus",
                "Ler o capítulo 7 do livro O Desejado de Todas as Nações sobre a infância de Jesus. Apresentar para um grupo, Clube ou Unidade as lições encontradas, demonstrando a importância que o estudo da natureza exerceu na educação e ministério de Jesus.",
                "NATUREZA_E_ECOLOGIA", "REUNIAO_CLUBE", ["reuniao_clube", "leitura", "debate_apresentacao"], "EQ-IDENTIFICACAO-NATUREZA"),
            req("guia", "REGULAR", "VII", "Estudo da Natureza", "VII.2", "Completar a especialidade de Ecologia ou Conservação Ambiental",
                "Completar uma das seguintes especialidades:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube", "ar_livre"], "EQ-ESP-NATUREZA-ECOLOGIA", "ESCOLHER_1", [
                    {"code": "a", "text": "Ecologia"},
                    {"code": "b", "text": "Conservação ambiental"}
                ]),

            # VIII. ARTE DE ACAMPAR
            req("guia", "REGULAR", "VIII", "Arte de Acampar", "VIII.1", "Participar com a Unidade de acampamento com estrutura de pioneiria e planejá-lo",
                "Participar com sua Unidade de um acampamento com estrutura de pioneiria, planejar o que deve ser levado e o que vai acontecer neste acampamento.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "nos_e_amarras"], "EQ-ACAMPAMENTO-PRATICO"),
            req("guia", "REGULAR", "VIII", "Arte de Acampar", "VIII.2", "Planejar, preparar e cozinhar três refeições ao ar livre",
                "Planejar, preparar e cozinhar três refeições ao ar livre.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "fogueira_cozinha"], "EQ-FOGUEIRA-COZINHA"),
            req("guia", "REGULAR", "VIII", "Arte de Acampar", "VIII.3", "Construir e utilizar um móvel de acampamento em tamanho real com nós e amarras",
                "Construir e utilizar um móvel de acampamento em tamanho real, com nós e amarras.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre", "nos_e_amarras"], "EQ-NOS-AMARRAS-PIONEIRIA"),
            req("guia", "REGULAR", "VIII", "Arte de Acampar", "VIII.4", "Completar uma nova especialidade válida para Mestrado (Aquática, Esportes, Recreativas ou Vida Campestre)",
                "Completar uma especialidade, não realizada anteriormente, que possa ser contada para um dos mestrados abaixo:",
                "ESPECIALIDADES", "AR_LIVRE", ["especialidade", "ar_livre", "acampamento"], "EQ-ESP-ACAMPAMENTO-ARTE", "ESCOLHER_1", [
                    {"code": "a", "text": "Aquática"},
                    {"code": "b", "text": "Esportes"},
                    {"code": "c", "text": "Atividades recreativas"},
                    {"code": "d", "text": "Vida campestre"}
                ]),

            # IX. ESTILO DE VIDA
            req("guia", "REGULAR", "IX", "Estilo de Vida", "IX.1", "Completar uma nova especialidade em Recreativas, Saúde, Domésticas ou Profissionais",
                "Completar uma especialidade, não realizada anteriormente, em uma das seguintes áreas:",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS", "ESCOLHER_1", [
                    {"code": "a", "text": "Atividades recreativas"},
                    {"code": "b", "text": "Ciência e saúde"},
                    {"code": "c", "text": "Habilidades domésticas"},
                    {"code": "d", "text": "Atividades profissionais"}
                ])
        ],
        "advanced_requirements": [
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.1", "Completar a especialidade de Mordomia",
                "Completar a especialidade de Mordomia.",
                "ESPECIALIDADES", "IGREJA", ["especialidade", "igreja", "reuniao_clube"], "EQ-ESP-ESTILO-VIDA-DIVERSAS"),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.2", "Ler o livro 'O Maior Discurso de Cristo' e escrever 1 página sobre seu efeito",
                "Ler o livro O maior discurso de Cristo e escrever uma página sobre o efeito da leitura em sua vida.",
                "IDEAIS_E_LEITURA", "CASA_INDIVIDUAL", ["em_casa", "leitura"], "EQ-LIVRO-ESPECIFICO"),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.3", "Trazer 2 amigos a duas reuniões da igreja ou participar de 4 domingos de evangelismo jovem",
                "Cumprir um dos seguintes itens:",
                "COMUNIDADE_E_MISSAO", "IGREJA", ["igreja", "comunidade"], "EQ-MISSAO-EVANGELISMO", "ESCOLHER_1", [
                    {"code": "a", "text": "Trazer dois amigos para assistir a duas diferentes reuniões da igreja"},
                    {"code": "b", "text": "Ajudar a planejar e participar de, no mínimo, quatro domingos em uma série de evangelismo jovem"}
                ]),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.4", "Escrever uma página ou apresentar palestra sobre como influenciar amigos para Cristo",
                "Escrever uma página ou apresentar uma palestra sobre como influenciar amigos para Cristo.",
                "COMUNIDADE_E_MISSAO", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-MISSAO-EVANGELISMO"),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.5", "Observar por 2 meses o trabalho dos diáconos e apresentar relatório detalhado",
                "Observar durante o período de dois meses o trabalho dos diáconos, apresentando um relatório detalhado de suas atividades, contendo:",
                "LIDERANCA_E_IGREJA", "IGREJA", ["igreja"], "EQ-CERIMONIAS-E-LIDERANCA-IGREJA", "TODOS", [
                    {"code": "a", "text": "Cuidado da propriedade da igreja"},
                    {"code": "b", "text": "Cerimônia de lava-pés"},
                    {"code": "c", "text": "Cerimônia de batismo"},
                    {"code": "d", "text": "Recolhimento dos dízimos e ofertas"}
                ]),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.6", "Completar uma nova especialidade para o mestrado em Vida Campestre",
                "Completar uma especialidade, não realizada anteriormente, para o mestrado em Vida campestre.",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre"], "EQ-ESP-ACAMPAMENTO-ARTE"),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.7", "Projetar 3 tipos diferentes de abrigo, explicar seu uso e utilizar um em acampamento",
                "Projetar três tipos diferentes de abrigo, explicar seu uso e utilizar um deles em um acampamento.",
                "ACAMPAMENTO_E_PIONEIRIA", "ACAMPAMENTO", ["acampamento", "ar_livre"], "EQ-ACAMPAMENTO-PRATICO"),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.8", "Assistir a seminário ou apresentar palestra sobre 2 temas (Aborto, Bullying, Violência, Drogas ou ISTs)",
                "Assistir a um seminário ou apresentar uma palestra sobre dois dos seguintes temas:",
                "SAUDE_E_APTIDAO", "REUNIAO_CLUBE", ["reuniao_clube", "debate_apresentacao"], "EQ-TEMPERANCA-SAUDE", "ESCOLHER_2", [
                    {"code": "a", "text": "Aborto"},
                    {"code": "b", "text": "Bullying"},
                    {"code": "c", "text": "Violência"},
                    {"code": "d", "text": "Drogas"},
                    {"code": "e", "text": "Infecções sexualmente transmissíveis"}
                ]),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.9", "Completar a especialidade de Liderança Campestre",
                "Completar a especialidade de Liderança campestre.",
                "ESPECIALIDADES", "ACAMPAMENTO", ["especialidade", "acampamento", "ar_livre"], "EQ-ESP-ACAMPAMENTO-ARTE"),
            req("guia-avancado", "AVANCADA", "AV", "Guia de Exploração", "AV.10", "Completar a especialidade de Orçamento Familiar",
                "Completar a especialidade de Orçamento familiar.",
                "ESPECIALIDADES", "REUNIAO_CLUBE", ["especialidade", "reuniao_clube", "em_casa"], "EQ-ESP-ESTILO-VIDA-DIVERSAS")
        ]
    }
]


def main():
    all_requirements_flat = []
    for cls in CLASSES_DATA:
        for r in cls["regular_requirements"]:
            all_requirements_flat.append({
                **r,
                "class_name": cls["name"],
                "min_age": cls["min_age"],
                "color_hex": cls["color_hex"]
            })
        for r in cls["advanced_requirements"]:
            all_requirements_flat.append({
                **r,
                "class_name": cls["advanced_name"],
                "min_age": cls["min_age"],
                "color_hex": cls["color_hex"]
            })

        # Também gera um arquivo Markdown limpo e formatado para cada cartão oficial
        md_lines = [
            f"# Cartão Oficial: {cls['name']} e {cls['advanced_name']} ({cls['min_age']} anos)",
            "",
            f"- **Cor Oficial:** {cls['color_name']} (`{cls['color_hex']}`)",
            f"- **Foco Pedagógico:** {cls['focus']}",
            f"- **Fonte Oficial DSA:** {cls['official_url']}",
            "",
            f"## Classe Regular — {cls['name']}",
            ""
        ]
        current_sec = None
        for r in cls["regular_requirements"]:
            sec_header = f"{r['section_code']}. {r['section_name']}"
            if sec_header != current_sec:
                current_sec = sec_header
                md_lines.append(f"### {sec_header}")
                md_lines.append("")
            md_lines.append(f"- **{r['code']} — {r['title']}**  ")
            md_lines.append(f"  {r['description']}  ")
            md_lines.append(f"  *Categoria:* `{r['category']}` | *Contexto:* `{r['execution_context']}` | *Tags:* {', '.join(f'`{t}`' for t in r['tags'])}")
            for sub in r["sub_items"]:
                md_lines.append(f"  - **{sub['code']})** {sub['text']}")
            md_lines.append("")

        md_lines.append(f"## Classe Avançada — {cls['advanced_name']}")
        md_lines.append("")
        for r in cls["advanced_requirements"]:
            md_lines.append(f"- **{r['code']} — {r['title']}**  ")
            md_lines.append(f"  {r['description']}  ")
            md_lines.append(f"  *Categoria:* `{r['category']}` | *Contexto:* `{r['execution_context']}` | *Tags:* {', '.join(f'`{t}`' for t in r['tags'])}")
            for sub in r["sub_items"]:
                md_lines.append(f"  - **{sub['code']})** {sub['text']}")
            md_lines.append("")

        md_path = os.path.join(MD_DIR, f"cartao_{cls['slug']}.md")
        with open(md_path, "w", encoding="utf-8") as f_md:
            f_md.write("\n".join(md_lines))

    output_payload = {
        "metadata": {
            "title": "Catálogo Oficial de Cartões de Classes dos Desbravadores (DSA)",
            "version": "2026.1",
            "source": "Divisão Sul-Americana da IASD (adventistas.org / mda.wiki.br)",
            "total_classes_pairs": len(CLASSES_DATA),
            "total_classes_individual": len(CLASSES_DATA) * 2,
            "total_regular_requirements": sum(len(c["regular_requirements"]) for c in CLASSES_DATA),
            "total_advanced_requirements": sum(len(c["advanced_requirements"]) for c in CLASSES_DATA),
            "total_requirements": len(all_requirements_flat)
        },
        "categories": CATEGORIES_CATALOG,
        "context_tags": CONTEXT_TAGS_CATALOG,
        "equivalence_groups": EQUIVALENCE_GROUPS,
        "classes": CLASSES_DATA,
        "requirements_flat": all_requirements_flat
    }

    json_path = os.path.join(DATA_DIR, "cartoes-classes.json")
    with open(json_path, "w", encoding="utf-8") as f_json:
        json.dump(output_payload, f_json, ensure_ascii=False, indent=2)

    print(f"JSON gerado com sucesso em: {json_path}")
    print(f"Total de requisitos mapeados: {len(all_requirements_flat)} "
          f"({output_payload['metadata']['total_regular_requirements']} regulares + "
          f"{output_payload['metadata']['total_advanced_requirements']} avançados)")


if __name__ == "__main__":
    main()
