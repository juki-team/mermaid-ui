import { convertToModelMessages, stepCountIs, streamText, tool, UIMessage } from 'ai';
import z from 'zod';

export async function POST(req: Request) {
  const { messages, code, error }: { messages: UIMessage[]; code: string; error: string } = await req.json();

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    system: `Eres un experto en visualización de datos y diagramas Mermaid.

Tu único objetivo es ayudar al usuario a crear, corregir y mejorar diagramas Mermaid.

TIPOS DE DIAGRAMAS SOPORTADOS:
- flowchart / graph: Diagramas de flujo
- sequenceDiagram: Diagramas de secuencia
- classDiagram: Diagramas de clases UML
- stateDiagram-v2: Máquinas de estado
- erDiagram: Entidad-relación
- gantt: Diagramas de Gantt
- pie: Gráficas de pastel
- gitGraph: Flujos de Git
- mindmap: Mapas mentales
- timeline: Líneas de tiempo
- xychart-beta: Gráficas XY (barras, líneas)

REGLAS:
- Siempre usa la herramienta 'suggestMermaid' para entregar el diagrama.
- El código Mermaid debe ser válido y renderizable.
- Si el usuario describe algo en lenguaje natural, conviértelo al diagrama más apropiado.
- Si hay errores en el código del usuario, corrígelos y explica brevemente qué cambiaste.
- Mantén las explicaciones breves y técnicas.

CONTEXTO ACTUAL DEL PROBLEMA:
<code>${code || ''}</code>
<error>${error || ''}</error>
`,
    messages: await convertToModelMessages(messages).catch(() => []),
    tools: {
      suggestMermaid: tool({
        description: 'Entrega un diagrama Mermaid válido para renderizar en el cliente.',
        inputSchema: z.object({
          content: z.string().describe('Código Mermaid válido y completo, listo para renderizar.'),
          title: z.string().optional().describe('Título descriptivo del diagrama.'),
          explanation: z.string().optional().describe('Breve explicación de lo que representa el diagrama o los cambios realizados.'),
        }),
        execute: async (args) => {
          return { status: 'success', data: args };
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
