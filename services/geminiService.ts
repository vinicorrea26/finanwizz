import { GoogleGenAI, Type, Chat } from "@google/genai";
import { FinancialAnalysis, Client } from "../types";
import * as XLSX from "xlsx";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const processFile = async (file: File): Promise<any> => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  
  if (isExcel) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    let fullText = "";
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      fullText += `\nSheet: ${sheetName}\n${JSON.stringify(json)}\n`;
    });
    
    return { text: `Conteúdo do Arquivo (${file.name}):\n${fullText}` };
  } else {
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: base64Data,
        mimeType: file.type
      }
    };
  }
};

export const analyzeFinancialDocuments = async (dreFiles: File[], bpFiles: File[], client: Client): Promise<FinancialAnalysis> => {
  const model = "gemini-3-flash-preview";
  
  const dreParts = await Promise.all(dreFiles.map(file => processFile(file)));
  const bpParts = await Promise.all(bpFiles.map(file => processFile(file)));

  const hasBP = bpFiles.length > 0;

  const prompt = `Analise os documentos financeiros da empresa ${client.nomeFantasia}.
  
  MISSÃO PRINCIPAL:
  1. DRE: Extraia Receita, Custos, Lucro Bruto, EBITDA, EBIT(LAJIR), EBT(LAIR) e Lucro Líquido.
  2. INDICADORES: Calcule margens e índices de eficiência.
  ${hasBP ? `3. BALANÇO PATRIMONIAL (CRÍTICO): Os arquivos de Balanço foram enviados. Você DEVE extrair e calcular:
     - Liquidez: Corrente, Seca, Imediata e Geral.
     - Endividamento: Geral, ML/PL, Composição e Dívida Líquida.
     - Estrutura: Capital de Giro Líquido (CGL), Necessidade de Cap. Giro (NCG) e Saldo de Tesouraria.
     - Eficiência: Giro do Ativo e Imobilização do PL.
     - Solvência: Alavancagem Financeira e Cobertura de Capital Próprio.` : '3. BALANÇO: Não foram enviados arquivos de Balanço, ignore este campo.'}

  Retorne um JSON estrito seguindo o schema fornecido. Não adicione texto fora do JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        ...dreParts,
        ...bpParts,
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dre: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                periodo: { type: Type.STRING },
                receita: { type: Type.NUMBER },
                custos: { type: Type.NUMBER },
                lucroBruto: { type: Type.NUMBER },
                despesas: { type: Type.NUMBER },
                ebitda: { type: Type.NUMBER },
                lajir: { type: Type.NUMBER },
                lair: { type: Type.NUMBER },
                lucroLiquido: { type: Type.NUMBER }
              }
            }
          },
          fluxoCaixa: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                periodo: { type: Type.STRING },
                entrada: { type: Type.NUMBER },
                saida: { type: Type.NUMBER },
                saldoOperacional: { type: Type.NUMBER },
                saldoAcumulado: { type: Type.NUMBER }
              }
            }
          },
          balanco: {
            type: Type.OBJECT,
            properties: {
              liquidez: {
                type: Type.OBJECT,
                properties: { corrente: { type: Type.NUMBER }, seca: { type: Type.NUMBER }, imediata: { type: Type.NUMBER }, geral: { type: Type.NUMBER } }
              },
              endividamento: {
                type: Type.OBJECT,
                properties: { geral: { type: Type.NUMBER }, dividaPatrimonio: { type: Type.NUMBER }, composicao: { type: Type.NUMBER }, dividaLiquida: { type: Type.NUMBER } }
              },
              estrutura: {
                type: Type.OBJECT,
                properties: { cgl: { type: Type.NUMBER }, ncg: { type: Type.NUMBER }, saldoTesouraria: { type: Type.NUMBER } }
              },
              eficiencia: {
                type: Type.OBJECT,
                properties: { giroAtivo: { type: Type.NUMBER }, giroAtivoCirculante: { type: Type.NUMBER }, imobilizacaoPL: { type: Type.NUMBER } }
              },
              solvencia: {
                type: Type.OBJECT,
                properties: { alavancagemFinanceira: { type: Type.NUMBER }, dependenciaTerceiros: { type: Type.NUMBER }, coberturaCapitalProprio: { type: Type.NUMBER } }
              },
              resumoPatrimonial: {
                type: Type.OBJECT,
                properties: { crescimentoAtivo: { type: Type.NUMBER }, evolucaoPL: { type: Type.NUMBER }, participacaoCaixa: { type: Type.NUMBER } }
              }
            }
          },
          kpis: {
            type: Type.OBJECT,
            properties: {
              margemBruta: { type: Type.NUMBER },
              margemLiquida: { type: Type.NUMBER },
              burnRate: { type: Type.NUMBER },
              runway: { type: Type.NUMBER },
              liquidezCorrente: { type: Type.NUMBER },
              endividamento: { type: Type.NUMBER },
              despesasComerciaisPerc: { type: Type.NUMBER },
              despesasAdmPerc: { type: Type.NUMBER },
              eficienciaOperacional: { type: Type.NUMBER },
              margemOperacional: { type: Type.NUMBER },
              margemEbitda: { type: Type.NUMBER },
              pontoEquilibrio: { type: Type.NUMBER },
              alavancagemOperacional: { type: Type.NUMBER }
            }
          },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          taxAnalysis: { type: Type.ARRAY, items: { type: Type.STRING } },
          composition: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ["dre", "fluxoCaixa", "kpis", "insights", "recommendations", "taxAnalysis"]
      }
    }
  });

  const rawText = response.text;
  return JSON.parse(rawText) as FinancialAnalysis;
};

export const createFinancialChat = (data: FinancialAnalysis): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `Você é um consultor financeiro sênior de elite da Alexy Divino Enterprise. Use estes dados reais da empresa: ${JSON.stringify(data)}. 
      Sempre responda em Português do Brasil. Use Markdown para formatar (tabelas, negrito, listas). 
      Seja técnico mas acessível. Fale sobre DRE e Balanço (se disponível).`,
      thinkingConfig: { thinkingBudget: 16000 }
    },
  });
};
