import {
  Document, Page, View, Text, StyleSheet, pdf,
} from '@react-pdf/renderer';
import type { Personagem, Atributo, NomeClasse } from '@/types/personagem';
import { CLASSES, SUBCLASSES, ANCESTRALIDADES, COMUNIDADES, getCarta } from '@/data';
import type { DadosSubclasse, DadosAncestralidade, DadosComunidade } from '@/types/dados';

// ─── Dados estáticos ──────────────────────────────────────────────────────────

const ATRS: Atributo[] = ['Agilidade', 'Força', 'Acuidade', 'Instinto', 'Presença', 'Conhecimento'];

const SUBS: Record<Atributo, string[]> = {
  Agilidade:    ['Correr', 'Equilibrar-se', 'Saltar'],
  Força:        ['Agarrar', 'Levantar', 'Romper'],
  Acuidade:     ['Esconder-se', 'Manipular', 'Manobrar'],
  Instinto:     ['Perceber', 'Pressentir', 'Orientar'],
  Presença:     ['Comover', 'Convencer', 'Enganar'],
  Conhecimento: ['Analisar', 'Aprender', 'Lembrar'],
};

// ─── Paleta (imita a ficha oficial: monocromático, pronto para impressão) ─────

const C = {
  white:       '#FFFFFF',
  black:       '#0D0D0D',
  headerBg:    '#1C1C1C',
  headerText:  '#FFFFFF',
  border:      '#767676',
  thinBorder:  '#C0C0C0',
  body:        '#1A1A1A',
  dim:         '#888888',
  label:       '#606060',
  boxFilled:   '#2A2A2A',
  red:         '#8B1A1A',
  redBorder:   '#9B2D2D',
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: C.body,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // Header bar (fundo escuro + texto branco)
  bar: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 5,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barText: {
    color: C.headerText,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },

  // Content box connected below header bar
  box: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.border,
    padding: 5,
  },

  // Field label
  lbl: {
    fontSize: 4.8,
    color: C.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },

  // Field value underlined
  val: {
    fontSize: 7.5,
    color: C.body,
    borderBottomWidth: 0.5,
    borderBottomColor: C.thinBorder,
    paddingBottom: 1.5,
    minHeight: 11,
  },
  valBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.body,
    borderBottomWidth: 0.5,
    borderBottomColor: C.thinBorder,
    paddingBottom: 1.5,
    minHeight: 11,
  },

  // Track box (PV/PF/PA/Esperança)
  tbox: {
    width: 9,
    height: 9,
    borderWidth: 0.8,
    borderColor: C.border,
    marginRight: 1.5,
    marginBottom: 1.5,
  },
  tboxFull: {
    width: 9,
    height: 9,
    borderWidth: 0.8,
    borderColor: C.border,
    backgroundColor: C.boxFilled,
    marginRight: 1.5,
    marginBottom: 1.5,
  },

  // Ability block
  ab: { marginBottom: 4 },
  abName: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  abDesc: { fontSize: 6, lineHeight: 1.4, color: C.body },
});

// ─── Micro-componentes ────────────────────────────────────────────────────────

function Bar({ title, right }: { title: string; right?: string }) {
  return (
    <View style={S.bar}>
      <Text style={S.barText}>{title.toUpperCase()}</Text>
      {right !== undefined && (
        <Text style={{ ...S.barText, fontSize: 5.5, fontFamily: 'Helvetica', letterSpacing: 0.3 }}>
          {right}
        </Text>
      )}
    </View>
  );
}

function Boxes({ filled, total }: { filled: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={i < filled ? S.tboxFull : S.tbox} />
      ))}
    </View>
  );
}

function Lbl({ c }: { c: string }) {
  return <Text style={S.lbl}>{c}</Text>;
}

function EmptyLines({ n }: { n: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{ borderBottomWidth: 0.5, borderBottomColor: C.thinBorder, height: 11, marginBottom: 2 }} />
      ))}
    </>
  );
}

// ─── Página 1 — ficha principal ───────────────────────────────────────────────

function Pagina1({ p }: { p: Personagem }) {
  const cls = p.classe ? CLASSES[p.classe as NomeClasse] : null;
  const profStr = '●'.repeat(p.proficiencia) + '○'.repeat(Math.max(0, 6 - p.proficiencia));

  return (
    <Page size="A4" style={S.page}>

      {/* ══ CABEÇALHO: logo + identidade ══ */}
      <View style={{ flexDirection: 'row', marginBottom: 5 }}>
        <View style={{ backgroundColor: C.headerBg, padding: 7, width: 105, justifyContent: 'center' }}>
          <Text style={{ color: C.headerText, fontSize: 11, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 }}>
            DAGGERHEART
          </Text>
          <Text style={{ color: '#AAAAAA', fontSize: 5.5, letterSpacing: 0.6, marginTop: 2 }}>
            FICHA DE PERSONAGEM
          </Text>
        </View>

        <View style={{ flex: 1, marginLeft: 7 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 5 }}>
            <View style={{ flex: 2 }}>
              <Lbl c="Nome" />
              <Text style={S.val}>{p.nome || '—'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Lbl c="Gênero" />
              <Text style={S.val}>{p.genero || '—'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Lbl c="Herança" />
              <Text style={S.val}>{p.ancestralidade || '—'}</Text>
            </View>
            <View style={{ flex: 1.6 }}>
              <Lbl c="Classe & Subclasse" />
              <Text style={S.val}>
                {p.classe || '—'}{p.subclasse ? ` · ${p.subclasse}` : ''}
              </Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 3, minWidth: 38 }}>
              <Text style={{ fontSize: 5, color: C.label, textTransform: 'uppercase', letterSpacing: 0.4 }}>Nível</Text>
              <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', lineHeight: 1 }}>{p.nivel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ══ EVASÃO + ARMADURA + 6 ATRIBUTOS ══ */}
      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 5 }}>
        <View style={{ width: 40, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 4 }}>
          <Text style={{ fontSize: 5, color: C.label, textTransform: 'uppercase', letterSpacing: 0.3 }}>Evasão</Text>
          <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', lineHeight: 1.1 }}>{p.evasao}</Text>
        </View>

        <View style={{ width: 50, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 4 }}>
          <Text style={{ fontSize: 5, color: C.label, textTransform: 'uppercase', letterSpacing: 0.3 }}>Armadura</Text>
          <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', lineHeight: 1.1 }}>{p.pa_max}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, marginTop: 2 }}>
            {Array.from({ length: p.pa_max }).map((_, i) => (
              <View key={i} style={{
                width: 6, height: 6,
                borderWidth: 0.7, borderColor: C.border,
                backgroundColor: i < p.pa_marcados ? C.boxFilled : C.white,
              }} />
            ))}
          </View>
        </View>

        {ATRS.map(nome => {
          const a = p.atributos[nome];
          const v = (a?.valor ?? 0) + (a?.bonus ?? 0);
          return (
            <View key={nome} style={{ flex: 1, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 3, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 5, color: C.label, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.2 }}>
                {nome}
              </Text>
              <Text style={{ fontSize: 15, fontFamily: 'Helvetica-Bold', lineHeight: 1.1 }}>
                {v > 0 ? `+${v}` : v}
              </Text>
              <View style={{ borderTopWidth: 0.5, borderTopColor: C.thinBorder, width: '100%', marginTop: 2, paddingTop: 2 }}>
                {SUBS[nome].map(sub => (
                  <Text key={sub} style={{ fontSize: 4.8, color: C.dim, textAlign: 'center', lineHeight: 1.3 }}>
                    {sub}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* ══ CONTEÚDO PRINCIPAL (2 colunas) ══ */}
      <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>

        {/* ──── COLUNA ESQUERDA (42%) ──── */}
        <View style={{ width: '42%' }}>

          {/* Saúde & Dano */}
          <Bar title="Saúde & Dano" />
          <View style={{ ...S.box, marginBottom: 4 }}>
            <Text style={{ fontSize: 5.5, color: C.dim, marginBottom: 4 }}>
              Some seu nível atual aos seus limiares de dano.
            </Text>
            <View style={{ flexDirection: 'row', gap: 3, marginBottom: 5 }}>
              {[
                { label: 'Dano Menor', val: `0 - ${Math.max(0, p.limiares[0] + p.nivel - 1)}`, sub: 'Marque 1 PV', clr: C.body,   bdr: C.border    },
                { label: 'Dano Maior', val: `${p.limiares[0] + p.nivel}+`,                   sub: 'Marque 2 PV', clr: C.body,   bdr: C.border    },
                { label: 'Dano Grave', val: `${p.limiares[1] + p.nivel}+`,                   sub: 'Marque 3 PV', clr: C.red,    bdr: C.redBorder },
              ].map(d => (
                <View key={d.label} style={{ flex: 1, borderWidth: 0.8, borderColor: d.bdr, alignItems: 'center', paddingVertical: 3 }}>
                  <Text style={{ fontSize: 4.8, color: d.clr, textTransform: 'uppercase', textAlign: 'center' }}>{d.label}</Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: d.clr }}>{d.val}</Text>
                  <Text style={{ fontSize: 4.5, color: d.clr }}>{d.sub}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>PV</Text>
                <Text style={{ fontSize: 5.5, color: C.dim }}>{p.pv_max - p.pv_marcados}/{p.pv_max}</Text>
              </View>
              <Boxes filled={p.pv_marcados} total={p.pv_max} />
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold' }}>PF</Text>
                <Text style={{ fontSize: 5.5, color: C.dim }}>{p.pf_max - p.pf_marcados}/{p.pf_max}</Text>
              </View>
              <Boxes filled={p.pf_marcados} total={p.pf_max} />
            </View>
          </View>

          {/* Esperança */}
          <Bar title="Esperança" />
          <View style={{ ...S.box, marginBottom: 4 }}>
            <Text style={{ fontSize: 5.5, color: C.dim, marginBottom: 4 }}>
              Gaste 1 Ponto de Esperança para usar uma Experiência ou prestar ajuda.
            </Text>
            <Boxes filled={p.esperanca} total={6} />
            {cls && (
              <View style={{ borderTopWidth: 0.5, borderTopColor: C.thinBorder, marginTop: 4, paddingTop: 3 }}>
                <Text style={{ ...S.lbl, marginBottom: 2 }}>Habilidade de Esperança</Text>
                <Text style={S.abName}>{cls.esperanca.nome} ({cls.esperanca.custo} Esp.)</Text>
                <Text style={S.abDesc}>{cls.esperanca.efeito}</Text>
              </View>
            )}
          </View>

          {/* Experiências */}
          <Bar title="Experiências" />
          <View style={{ ...S.box, marginBottom: 4 }}>
            {p.experiencias.filter(e => e.nome.trim() !== '').map((e, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 3, gap: 4 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', width: 18, textAlign: 'right' }}>+{e.mod}</Text>
                <View style={{ flex: 1, borderBottomWidth: 0.5, borderBottomColor: C.thinBorder, paddingBottom: 1 }}>
                  <Text style={{ fontSize: 7 }}>{e.nome}</Text>
                </View>
              </View>
            ))}
            <EmptyLines n={Math.max(0, 5 - p.experiencias.filter(e => e.nome.trim() !== '').length)} />
          </View>

          {/* Habilidades de Classe */}
          {cls && (
            <>
              <Bar title="Habilidades de Classe" />
              <View style={S.box}>
                {cls.habilidades_classe.map(h => (
                  <View key={h.nome} style={S.ab}>
                    <Text style={S.abName}>{h.nome}</Text>
                    <Text style={S.abDesc}>{h.descricao}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ──── COLUNA DIREITA ──── */}
        <View style={{ flex: 1 }}>

          {/* Armas Ativas */}
          <Bar title="Armas Ativas" right={`Proficiência  ${profStr}`} />
          <View style={{ ...S.box, marginBottom: 4 }}>
            {[
              { label: 'Principal',  arma: p.arma_principal  },
              { label: 'Secundária', arma: p.arma_secundaria },
            ].map(({ label, arma }) => (
              <View key={label} style={{ marginBottom: 7 }}>
                <Text style={{ fontSize: 6, color: C.label, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>
                  {label}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 3 }}>
                  <View style={{ flex: 1.5 }}>
                    <Lbl c="Nome" />
                    <Text style={S.val}>{arma.nome || '—'}</Text>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Lbl c="Atributo & Alcance" />
                    <Text style={S.val}>
                      {arma.atributo ? `${arma.atributo}${arma.alcance ? ` · ${arma.alcance}` : ''}` : '—'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Lbl c="Dados & Tipo" />
                    <Text style={S.valBold}>{arma.dado || '—'}{arma.tipo ? ` ${arma.tipo}` : ''}</Text>
                  </View>
                </View>
                <Lbl c="Habilidade" />
                <View style={{ borderBottomWidth: 0.5, borderBottomColor: C.thinBorder, minHeight: 14, paddingBottom: 1 }}>
                  <Text style={{ fontSize: 6.5, lineHeight: 1.4 }}>{arma.habilidade || ''}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Armadura Ativa */}
          <Bar title="Armadura Ativa" />
          <View style={{ ...S.box, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 3 }}>
              <View style={{ flex: 2 }}>
                <Lbl c="Nome" />
                <Text style={S.val}>{p.armadura_ativa.nome || '—'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Lbl c="Limiares Base" />
                <Text style={S.val}>{p.armadura_ativa.limiares_base[0]} / {p.armadura_ativa.limiares_base[1]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Lbl c="Armadura Base" />
                <Text style={S.valBold}>{p.armadura_ativa.armadura_base}</Text>
              </View>
            </View>
            <Lbl c="Habilidade" />
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: C.thinBorder, minHeight: 14, paddingBottom: 1 }}>
              <Text style={{ fontSize: 6.5, lineHeight: 1.4 }}>{p.armadura_ativa.efeito || ''}</Text>
            </View>
          </View>

          {/* Inventário */}
          <Bar title="Inventário" />
          <View style={{ ...S.box, marginBottom: 4 }}>
            {p.inventario.slice(0, 8).map((item, i) => (
              <View key={i} style={{ borderBottomWidth: 0.5, borderBottomColor: C.thinBorder, paddingBottom: 1, marginBottom: 2, minHeight: 11 }}>
                <Text style={{ fontSize: 7 }}>{item.nome}</Text>
              </View>
            ))}
            <EmptyLines n={Math.max(0, 7 - p.inventario.length)} />
          </View>

          {/* Ouro */}
          <Bar title="Ouro" />
          <View style={S.box}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {[
                { label: 'Punhados', v: p.ouro.punhados },
                { label: 'Bolsas',   v: p.ouro.bolsas   },
                { label: 'Baús',     v: p.ouro.baus     },
              ].map(({ label, v }) => (
                <View key={label} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 5, color: C.label, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1 }}>{label}</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Rodapé */}
      <View style={{ marginTop: 5, borderTopWidth: 0.5, borderTopColor: C.thinBorder, paddingTop: 3 }}>
        <Text style={{ fontSize: 5, color: '#BBBBBB', textAlign: 'center' }}>
          Daggerheart © Jambô Editora 2025  ·  Gerado por Fatewake
        </Text>
      </View>
    </Page>
  );
}

// ─── Página 2 — referência de habilidades ─────────────────────────────────────

interface P2Props {
  p: Personagem;
  sub?: DadosSubclasse;
  anc?: DadosAncestralidade;
  com?: DadosComunidade;
  cartas?: string[];
}

function Pagina2({ p, sub, anc, com, cartas = [] }: P2Props) {
  return (
    <Page size="A4" style={S.page}>
      {/* Mini-header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ backgroundColor: C.headerBg, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: C.headerText, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6 }}>
            DAGGERHEART
          </Text>
        </View>
        <Text style={{ fontSize: 7, color: C.dim }}>
          {p.nome} — Referência de Habilidades
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>

        {/* Coluna esquerda: Subclasse + Cartas */}
        {(sub || cartas.length > 0) && (
          <View style={{ flex: 1 }}>
            {sub && (
              <>
                <Bar title={`Subclasse — ${p.subclasse}`} />
                <View style={{ ...S.box, marginBottom: 6 }}>
                  {sub.atributo_conjuracao && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={S.lbl}>Atributo de Conjuração</Text>
                      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>{sub.atributo_conjuracao}</Text>
                    </View>
                  )}

                  <Text style={{ ...S.lbl, marginBottom: 3 }}>Habilidades Fundamentais</Text>
                  {sub.fundamental.map(h => (
                    <View key={h.nome} style={{ ...S.ab, paddingLeft: 5, borderLeftWidth: 1.5, borderLeftColor: C.border }}>
                      <Text style={S.abName}>{h.nome}</Text>
                      <Text style={S.abDesc}>{h.descricao}</Text>
                    </View>
                  ))}

                  <View style={{ marginTop: 5 }}>
                    <Text style={{ ...S.lbl, marginBottom: 3 }}>Especialização — Patamar 3</Text>
                    <View style={{ ...S.ab, paddingLeft: 5, borderLeftWidth: 1.5, borderLeftColor: C.thinBorder }}>
                      <Text style={{ ...S.abName, color: C.dim }}>{sub.especializacao.nome}</Text>
                      <Text style={{ ...S.abDesc, color: C.dim }}>{sub.especializacao.descricao}</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 5 }}>
                    <Text style={{ ...S.lbl, marginBottom: 3 }}>Maestria — Patamar 4</Text>
                    <View style={{ ...S.ab, paddingLeft: 5, borderLeftWidth: 1.5, borderLeftColor: C.thinBorder }}>
                      <Text style={{ ...S.abName, color: C.dim }}>{sub.maestria.nome}</Text>
                      <Text style={{ ...S.abDesc, color: C.dim }}>{sub.maestria.descricao}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {cartas.length > 0 && (
              <>
                <Bar title="Cartas de Domínio" />
                <View style={S.box}>
                  {cartas.map(id => {
                    const c = getCarta(id);
                    if (!c) return null;
                    const naReserva = p.cartas_reserva.includes(id);
                    return (
                      <View key={id} style={{ marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 }}>
                          <Text style={{ ...S.abName, color: naReserva ? C.dim : C.body }}>
                            {c.nome}
                          </Text>
                          <Text style={{ fontSize: 5, color: C.dim }}>
                            {c.dominio} · Nv.{c.nivel}{naReserva ? ' · reserva' : ''}
                          </Text>
                        </View>
                        <Text style={{ ...S.abDesc, color: naReserva ? C.dim : C.body }}>
                          {c.descricao}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {/* Ancestralidade + Comunidade + Notas */}
        <View style={{ flex: 1 }}>
          {anc && (
            <View style={{ marginBottom: 6 }}>
              <Bar title={`Ancestralidade — ${p.ancestralidade}`} />
              <View style={S.box}>
                <Text style={{ fontSize: 6, color: C.dim, lineHeight: 1.4, marginBottom: 5 }}>{anc.descricao}</Text>
                {[anc.habilidade_1, anc.habilidade_2].map(h => (
                  <View key={h.nome} style={S.ab}>
                    <Text style={S.abName}>{h.nome}</Text>
                    <Text style={S.abDesc}>{h.descricao}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {com && (
            <View style={{ marginBottom: 6 }}>
              <Bar title={`Comunidade — ${p.comunidade}`} />
              <View style={S.box}>
                <Text style={{ fontSize: 6, color: C.dim, lineHeight: 1.4, marginBottom: 5 }}>{com.descricao}</Text>
                <View style={S.ab}>
                  <Text style={S.abName}>{com.habilidade.nome}</Text>
                  <Text style={S.abDesc}>{com.habilidade.descricao}</Text>
                </View>
              </View>
            </View>
          )}

          {p.vinculos.some(v => v.trim()) && (
            <View style={{ marginBottom: 6 }}>
              <Bar title="Vínculos" />
              <View style={S.box}>
                {p.vinculos.filter(v => v.trim()).map((v, i) => (
                  <View key={i} style={{ borderBottomWidth: 0.5, borderBottomColor: C.thinBorder, paddingBottom: 2, marginBottom: 3 }}>
                    <Text style={{ fontSize: 7, lineHeight: 1.4 }}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {p.notas.trim() !== '' && (
            <>
              <Bar title="Diário da Saga" />
              <View style={S.box}>
                <Text style={{ fontSize: 7, lineHeight: 1.5 }}>{p.notas}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={{ marginTop: 5, borderTopWidth: 0.5, borderTopColor: C.thinBorder, paddingTop: 3 }}>
        <Text style={{ fontSize: 5, color: '#BBBBBB', textAlign: 'center' }}>
          Daggerheart © Jambô Editora 2025  ·  Gerado por Fatewake
        </Text>
      </View>
    </Page>
  );
}

// ─── Documento completo ───────────────────────────────────────────────────────

function FichaDocument({ p }: { p: Personagem }) {
  const sub = (p.subclasse && p.classe)
    ? SUBCLASSES.classes[p.classe as NomeClasse]?.find(s => s.nome === p.subclasse)
    : undefined;
  const anc = p.ancestralidade ? ANCESTRALIDADES[p.ancestralidade] : undefined;
  const com = p.comunidade ? COMUNIDADES[p.comunidade] : undefined;
  const todasCartas = [...p.cartas_mao, ...p.cartas_reserva];
  const hasPage2 = !!(sub || anc || com || p.notas.trim() || p.vinculos.some(v => v.trim()) || todasCartas.length > 0);

  return (
    <Document title={`${p.nome || 'Personagem'} — Ficha Daggerheart`} author="Fatewake">
      <Pagina1 p={p} />
      {hasPage2 && <Pagina2 p={p} sub={sub} anc={anc} com={com} cartas={todasCartas} />}
    </Document>
  );
}

// ─── Função pública de export ─────────────────────────────────────────────────

export async function exportarFichaPDF(p: Personagem): Promise<void> {
  const blob = await pdf(<FichaDocument p={p} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${p.nome || 'personagem'}-${p.classe || 'dh'}-ficha.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
