"""Generate the reviewable supporting PDFs. Requires reportlab, not used by the app."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, NextPageTemplate, PageBreak, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs'
INK = colors.HexColor('#17222d')
MUTED = colors.HexColor('#526171')
GOLD = colors.HexColor('#a57937')
STYLES = {
    'title': ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=25, leading=28, textColor=INK, spaceAfter=10),
    'subtitle': ParagraphStyle('subtitle', fontSize=10, leading=15, textColor=MUTED, spaceAfter=13),
    'heading': ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=GOLD, spaceBefore=10, spaceAfter=5, keepWithNext=True),
    'body': ParagraphStyle('body', fontSize=9.3, leading=13.1, textColor=INK, spaceAfter=7, alignment=TA_LEFT),
    'small': ParagraphStyle('small', fontSize=7.6, leading=10.2, textColor=MUTED, spaceAfter=4),
    'blog': ParagraphStyle('blog', fontSize=11, leading=17, textColor=INK, spaceAfter=13),
}

def p(text, style='body'):
    return Paragraph(text, STYLES[style])

def decorate(canvas, doc):
    w,h=A4
    canvas.setFillColor(INK)
    canvas.rect(0,h-13,w,13,fill=1,stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(36,h-13,80,3,fill=1,stroke=0)
    canvas.setStrokeColor(colors.HexColor('#dbe0e5'))
    canvas.line(36,37,w-36,37)
    canvas.setFont('Helvetica',7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(36,24,'Cyber Leek / TRACE / DataForge 2026 / Pathway track / AI-assisted')
    canvas.drawRightString(w-36,24,str(doc.page))

summary = [
('The claim and the pressure',
'A fixed-shape associative state can accept additional writes without adding a slot per input, but overlapping cues and competing values can corrupt recall. TRACE makes this claim inspectable for data scientists familiar with vectors and dot products. Conventional attention keeps explicit key/value histories. Compressing associations into a recurrent matrix makes state size independent of sequence length, while introducing a capacity and interference trade-off. This is a statement about a memory mechanism, not a promise of unlimited lossless context.'),
('A mechanism the learner can test',
'Our state M has nine key features and eight value features: 72 float64 cells. A Hebbian update adds the outer product of key k and value v, after multiplying the previous state by retention lambda. A query reads M by a dot product. Constructed keys share a component controlled by overlap rho; increasing rho makes distinct addresses more similar. The value readout passes through a trained softmax decoder. The learner edits pairs and controls, sees every matrix update, and compares prediction with the latest written target.'),
('A falsifiable sixty-second experiment',
'Write Atlas-Amber twice, then Atlas-Violet. Additive memory retains competing values and recalls Amber even though the latest target is Violet. Switch to a delta update, which writes the residual between the target value and the current readout: recall becomes Violet. The state remains 72 cells. With overlapping keys, such a correction can also disturb other memories. The experiment demonstrates both a useful update rule and the limit of treating all stored associations as independent.'),
('What connects to BDH',
'Dragon Hatchling interprets working memory through transient synaptic changes. BDH-GPU combines neuron-aligned linear attention with sparse positive activations and learned ReLU-low-rank transformations [1]. TRACE isolates the associative write/read motif; it omits those full architectural features, uses constructed cues and signed value codes, and does not reproduce a BDH language model. Pathway\'s derivation explains why the broader representation and computational structure matter, rather than merely replacing softmax attention in a small vector space [5].'),
('BDH-CQ and the research landscape',
'BDH-CQ combines context-updated recurrent memory with latent iterative reasoning [2]. Its paper reports 29.5% pass@2 on public ARC-AGI-1 for 150M parameters, including a black-box audit by Bielik and NYU co-authors without weights access. This is benchmark evidence; TRACE has not replicated the system. Its exact updates remain proprietary. Gated DeltaNet combines gating with delta updates [3]; Titans learns neural memory at test time [4]. They explore different control mechanisms, with full-model evidence on their own evaluation suites. TRACE does not establish an accuracy or cost ranking between them.'),
('Evidence, maturity and limits',
'TRACE trains 72 decoder parameters on 6,000 generated noisy-symbol samples and tests on 1,500 independent draws, seed 42. The local run classifies 1,499 test samples correctly. This easy synthetic decoding score does not measure long-context reasoning or BDH capability. Live retrieval tests separately cover clean recall, collision, interference and decay. Full-model advantages remain conditional on published experiments; this prototype has no learner-study evidence yet. It is mature enough for a reproducible mechanism demo, not for claims of general AI memory.'),
('What the artifact includes',
'The public artifact executes the same Python model through Pyodide in a browser worker; its notebook is device-local. The Docker edition uses FastAPI and SQLite with account-based persistence. Playback shows computed states, with inputs and model hash available for inspection. The 576-byte count excludes weights, traces and application overhead. Sequences are capped at 32 writes; retention acts per write, not wall-clock time. Saving a run is application persistence, not durable model learning.'),
]

refs = [
'[1] Kosowski et al. (2025). <link href="https://arxiv.org/abs/2509.26507" color="#a57937">The Dragon Hatchling. arXiv:2509.26507.</link>',
'[2] Engdahl et al. (2026). <link href="https://arxiv.org/abs/2608.09888" color="#a57937">BDH-CQ. arXiv:2608.09888.</link>',
'[3] Yang et al. (2024 / ICLR 2025). <link href="https://arxiv.org/abs/2412.06464" color="#a57937">Gated Delta Networks. arXiv:2412.06464.</link>',
'[4] Behrouz et al. (2025). <link href="https://arxiv.org/abs/2501.00663" color="#a57937">Titans. arXiv:2501.00663.</link>',
'[5] Pathway (2026). <link href="https://pathway.com/research/bdh-explainer/bdh-architecture-derivation" color="#a57937">From attention to synapses: deriving BDH.</link>',
]

def make_summary():
    w,h=A4
    doc=BaseDocTemplate(str(OUT/'CONCEPT_SUMMARY.pdf'),pagesize=A4,title='TRACE - One-page concept summary',author='Cyber Leek (AI-assisted)',leftMargin=36,rightMargin=36)
    col=(w-36*2-22)/2
    frames=[Frame(36,49,col,h-170,id='left',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0),Frame(36+col+22,49,col,h-170,id='right',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)]
    def page(canvas,doc):
        decorate(canvas,doc)
        canvas.setFont('Helvetica-Bold',25);canvas.setFillColor(INK);canvas.drawString(36,h-57,'TRACE: what a memory keeps')
        canvas.setFont('Helvetica',10);canvas.setFillColor(MUTED);canvas.drawString(36,h-79,'Associative memory and fast weights | One claim. A visible failure. A reproducible repair.')
        canvas.setStrokeColor(colors.HexColor('#dbe0e5'));canvas.line(36,h-96,w-36,h-96)
    doc.addPageTemplates(PageTemplate(id='summary',frames=frames,onPage=page))
    story=[]
    for title,body in summary:
        story.extend([p(title,'heading'),p(body)])
    story.append(p('Primary sources','heading'))
    story.extend(p(r,'small') for r in refs)
    story.append(p('<link href="https://yeshwanthv123.github.io/Dataforge2026/" color="#a57937">Open the public artifact</link> | <link href="https://github.com/Yeshwanthv123/Dataforge2026" color="#a57937">Source: Yeshwanthv123/Dataforge2026</link>', 'small'))
    doc.build(story)

def make_blog():
    doc=BaseDocTemplate(str(OUT/'TECHNICAL_BLOG.pdf'),pagesize=A4,title='TRACE - Make a memory, see what stays',author='Cyber Leek (AI-assisted)')
    w,h=A4
    doc.addPageTemplates(PageTemplate(id='blog',frames=[Frame(48,53,w-96,h-91,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=decorate))
    story=[p('Make a memory.<br/>See what stays.','title'),p('An explorable explanation of associative memory, fast weights and their connection to Dragon Hatchling.','subtitle')]
    for title,body in summary[:3]:
        story.extend([p(title,'heading'),p(body,'blog')])
    story.extend([p('The equations, with dimensions','heading'),p('Treat k as a 9-dimensional column vector and v as an 8-dimensional column vector. M has shape 9 by 8. The selected query q has nine components. All computation uses float64; exported matrices are rounded to five decimal places.','blog')])
    equations=[['Operation','Computation'],['Hebbian write','M = lambda M + eta outer(k, v)'],['Delta write','M_bar = lambda M\nM = M_bar + eta outer(k, v - M_bar.T k)'],['Recall','r = M.T q; p = softmax(W.T r + b)']]
    table=Table(equations,colWidths=[110,w-206]);table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('TEXTCOLOR',(0,0),(-1,0),colors.white),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTNAME',(0,1),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),9),('LEADING',(0,0),(-1,-1),14),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),('LINEBELOW',(0,1),(-1,-1),.5,colors.HexColor('#dbe0e5')),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story.append(table)
    story.extend([PageBreak(),p('The research connection','title')])
    for title,body in summary[3:6]:
        story.extend([p(title,'heading'),p(body,'blog')])
    story.extend([p('Why the reference can also fail','heading'),p('The explicit-token reference stores all keys and values and applies softmax to scaled query-key dot products. It keeps duplicate writes. In the collision example, two Amber entries can outweigh one Violet entry, so explicit storage does not automatically provide latest-value semantics. This is a small attention reference, not a complete Transformer or an oracle. Comparisons must state the retrieval target and update rules before declaring a winner.','blog')])
    story.extend([p('Temporary state is not durable learning','heading'),p('The decoder parameters are learned during a separate training process and remain fixed in every experiment. The memory matrix is initialized anew for each run. SQLite can store that run for later inspection, but a saved record is not a consolidated change in model parameters. These three forms of persistence must not be conflated.','blog')])
    story.extend([PageBreak(),p('From mechanism to artifact','title')])
    story.extend([p('A full-stack experiment you can inspect','heading'),p(summary[-1][1],'blog'),p('Training data and provenance','heading'),p('A seeded QR decomposition creates eight orthogonal value codes. Independent Gaussian perturbations produce training and held-out vectors. Full-batch cross-entropy training uses 200 updates, learning rate 0.7 and small L2 regularization. The complete dataset, codebook, learned weights, loss history and test result are saved in the build artifact. There is no downloaded language model and no paid inference API.','blog'),p('A live defense, not a scripted animation','heading'),p('Ask a learner to predict the collision before running it. Have them change one variable, read the actual state, and explain the mismatch. Then ask why increasing overlap might damage another cue even after a delta correction. Playback is a view of computed frames; the animation itself proves nothing without the equations, inputs and outputs. The strongest demonstration is a new input proposed by someone watching.','blog'),p('Evidence still missing','heading'),p('The prototype has controlled model/API tests and a repeatable demo, but no formal learner study, broad retrieval benchmark or independent full-BDH replication. Future work should measure whether learners can predict unfamiliar cases after the tutorial, introduce trainable cue representations, and compare carefully matched full architectures. None of those future results is claimed here.','blog'),p('Primary sources','heading')])
    story.extend(p(r,'small') for r in refs)
    story.extend([Spacer(1,8),p('AI assistance and provenance','heading'),p('Codex assisted with code, data generation, training, text, tests, design and presentation assets. No BDH implementation or pretrained weights were copied. Original code and project material are MIT-licensed; third-party notices are retained separately. See docs/AI_DISCLOSURE.md and docs/THIRD_PARTY.md. Team: Cyber Leek.','small'), p('<link href="https://yeshwanthv123.github.io/Dataforge2026/" color="#a57937">Public artifact: yeshwanthv123.github.io/Dataforge2026/</link><br/><link href="https://github.com/Yeshwanthv123/Dataforge2026" color="#a57937">Source: github.com/Yeshwanthv123/Dataforge2026</link>','small')])
    doc.build(story)

if __name__=='__main__':
    make_summary()
    make_blog()
    print('Created CONCEPT_SUMMARY.pdf and TECHNICAL_BLOG.pdf')
