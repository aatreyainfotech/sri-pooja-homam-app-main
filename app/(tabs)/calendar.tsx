import { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import panchang from '../../src/data/panchang2026.json';
import {
  Lang, LANG_LIST, tr, trMonth, trWeekShort, trWeekFull,
  trTithi, trNakshatra, trMasam, trRutuvu, trAyanam, trVratam, trFestival,
} from '../../src/i18n/panchang';
import { theme } from '../../src/constants/theme';

type DayInfo = {
  tithi: string; tithi_idx: number; paksha: 'shukla'|'krishna';
  nakshatra: string; weekday: string; masam: string; rutuvu: string; ayanam: string;
  samvatsara: string; festivals: string[]; vratam: string[];
};

const DAYS: Record<string, DayInfo> = (panchang as any).days || {};

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildMonthGrid(year: number, month: number) {
  // month is 0-indexed
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // Sun=0..Sat=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date | null; key: string | null; inMonth: boolean }[] = [];
  // Lead with prev month
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(year, month, -(firstWeekday - 1 - i));
    cells.push({ date: d, key: ymd(d.getFullYear(), d.getMonth(), d.getDate()), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: dt, key: ymd(year, month, d), inMonth: true });
  }
  // Trail next month
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date!;
    const nxt = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: nxt, key: ymd(nxt.getFullYear(), nxt.getMonth(), nxt.getDate()), inMonth: false });
  }
  return cells;
}

const YEAR = 2026;

export default function CalendarTab() {
  const [lang, setLang] = useState<Lang>('te');
  const [month, setMonth] = useState<number>(new Date().getFullYear() === YEAR ? new Date().getMonth() : 0);
  const [showLang, setShowLang] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthGrid(YEAR, month), [month]);
  const todayKey = useMemo(() => {
    const d = new Date();
    return ymd(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Collect vratam days for footer list
  const vratamList = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (let d = 1; d <= new Date(YEAR, month + 1, 0).getDate(); d++) {
      const key = ymd(YEAR, month, d);
      const info = DAYS[key];
      if (!info) continue;
      for (const v of info.vratam) {
        if (!groups[v]) groups[v] = [];
        groups[v].push(`${d}`);
      }
    }
    return groups;
  }, [month]);

  const selected: DayInfo | null = selectedKey ? DAYS[selectedKey] || null : null;
  const selectedDate = selectedKey ? new Date(selectedKey + 'T00:00:00') : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#8B1515' }}>
        <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.header}>
          <Text style={styles.brand}>🪷 {tr(lang, 'calendar')}</Text>
          <TouchableOpacity style={styles.langBtn} onPress={() => setShowLang(true)}>
            <Ionicons name="language" size={18} color="#fff" />
            <Text style={styles.langBtnText}>
              {LANG_LIST.find(l => l.code === lang)?.native}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            testID="cal-prev"
            onPress={() => setMonth(m => (m === 0 ? 0 : m - 1))}
            style={[styles.navBtn, month === 0 && { opacity: 0.4 }]}
            disabled={month === 0}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.monthTitle}>{trMonth(lang, month)} — {YEAR}</Text>
            <Text style={styles.monthSub}>{trMasam(lang, DAYS[ymd(YEAR, month, 15)]?.masam || 'pushya')}</Text>
          </View>
          <TouchableOpacity
            testID="cal-next"
            onPress={() => setMonth(m => (m === 11 ? 11 : m + 1))}
            style={[styles.navBtn, month === 11 && { opacity: 0.4 }]}
            disabled={month === 11}
          >
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Weekday header */}
        <View style={styles.weekRow}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Text key={i} style={[styles.weekLabel, (i === 0) && { color: '#C62828' }]}>
              {trWeekShort(lang, i)}
            </Text>
          ))}
        </View>

        {/* Days grid */}
        <View style={styles.grid}>
          {cells.map((c, i) => {
            const info = c.key ? DAYS[c.key] : undefined;
            const isToday = c.key === todayKey;
            const hasFestival = !!info?.festivals?.length;
            const isSunday = c.date?.getDay() === 0;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => { if (c.key && c.inMonth) setSelectedKey(c.key); }}
                style={[
                  styles.cell,
                  !c.inMonth && styles.cellMuted,
                  isToday && styles.cellToday,
                  hasFestival && c.inMonth && !isToday && styles.cellFest,
                ]}
              >
                <Text style={[
                  styles.cellNum,
                  !c.inMonth && { color: '#bbb' },
                  isSunday && c.inMonth && !isToday && !hasFestival && { color: '#C62828' },
                  (isToday || hasFestival) && c.inMonth && { color: '#fff' },
                ]}>
                  {c.date?.getDate()}
                </Text>
                {info?.vratam?.includes('ekadashi') && c.inMonth && (
                  <View style={[styles.dot, { backgroundColor: '#FF9800' }]} />
                )}
                {info?.vratam?.includes('purnima') && c.inMonth && (
                  <View style={[styles.ring, isToday && { borderColor: '#fff' }]} />
                )}
                {info?.vratam?.includes('amavasya') && c.inMonth && (
                  <View style={styles.black} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legItem}><View style={[styles.dot, { backgroundColor: '#FF9800' }]} /><Text style={styles.legText}>{trVratam(lang,'ekadashi')}</Text></View>
          <View style={styles.legItem}><View style={styles.ring} /><Text style={styles.legText}>{trVratam(lang,'purnima')}</Text></View>
          <View style={styles.legItem}><View style={styles.black} /><Text style={styles.legText}>{trVratam(lang,'amavasya')}</Text></View>
          <View style={styles.legItem}><View style={[styles.tag, { backgroundColor: theme.colors.primary }]} /><Text style={styles.legText}>{tr(lang,'festivals')}</Text></View>
        </View>

        {/* Vratam list */}
        <View style={styles.vratamBox}>
          <Text style={styles.vratamTitle}>{tr(lang, 'vratam')}</Text>
          <View style={styles.vratamGrid}>
            {['ekadashi','purnima','amavasya','pradosha','chaturthi','shashthi'].map(v => (
              vratamList[v]?.length ? (
                <View key={v} style={styles.vratamCell}>
                  <Text style={styles.vratamName}>{trVratam(lang, v)}</Text>
                  <Text style={styles.vratamDays}>{vratamList[v].join(', ')}</Text>
                </View>
              ) : null
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Language picker modal */}
      <Modal visible={showLang} animationType="slide" transparent onRequestClose={() => setShowLang(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowLang(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{tr(lang, 'selectLang')}</Text>
            {LANG_LIST.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langRow, l.code === lang && styles.langRowActive]}
                onPress={() => { setLang(l.code); setShowLang(false); }}
              >
                <Text style={[styles.langNative, l.code === lang && { color: theme.colors.primary }]}>{l.native}</Text>
                <Text style={styles.langLabel}>{l.label}</Text>
                {l.code === lang && <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetClose} onPress={() => setShowLang(false)}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Day detail modal */}
      <Modal visible={!!selectedKey} animationType="slide" onRequestClose={() => setSelectedKey(null)}>
        {selected && selectedDate && (
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <LinearGradient colors={['#8B1515', '#630B0B']} style={styles.detailHeader}>
              <TouchableOpacity testID="cal-detail-close" onPress={() => setSelectedKey(null)} style={styles.detailBack}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.detailDate}>
                  {selectedDate.getDate()} {trMonth(lang, selectedDate.getMonth())} {YEAR}
                </Text>
                <Text style={styles.detailWeek}>{trWeekFull(lang, selectedDate.getDay())}</Text>
              </View>
              <View style={{ width: 40 }} />
            </LinearGradient>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {/* Hero */}
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>{tr(lang, 'samvatsara')}</Text>
                <Text style={styles.heroMain}>
                  {trMasam(lang, selected.masam)} · {tr(lang, selected.paksha)}
                </Text>
                <Text style={styles.heroSub}>
                  {trRutuvu(lang, selected.rutuvu)} · {trAyanam(lang, selected.ayanam)}
                </Text>
              </View>

              {/* Festivals */}
              <View style={styles.card}>
                <Text style={styles.cardHead}>{tr(lang, 'festivals')}</Text>
                {selected.festivals.length > 0 ? (
                  selected.festivals.map((f, i) => (
                    <View key={i} style={styles.festRow}>
                      <Ionicons name="sparkles" size={18} color={theme.colors.secondary} />
                      <Text style={styles.festText}>{trFestival(lang, f)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{tr(lang, 'noFestivals')}</Text>
                )}
              </View>

              {/* Vratam */}
              {selected.vratam.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardHead}>{tr(lang, 'vratam')}</Text>
                  <View style={styles.vratamChips}>
                    {selected.vratam.map((v, i) => (
                      <View key={i} style={styles.chip}>
                        <Text style={styles.chipText}>{trVratam(lang, v)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tithi / Nakshatra */}
              <View style={styles.card}>
                <View style={styles.row2}>
                  <View style={styles.col}>
                    <Text style={styles.keyLabel}>{tr(lang, 'tithi')}</Text>
                    <Text style={styles.keyValue}>{trTithi(lang, selected.tithi)}</Text>
                    <Text style={styles.keySub}>{tr(lang, selected.paksha)}</Text>
                  </View>
                  <View style={styles.vsep} />
                  <View style={styles.col}>
                    <Text style={styles.keyLabel}>{tr(lang, 'nakshatra')}</Text>
                    <Text style={styles.keyValue}>{trNakshatra(lang, selected.nakshatra)}</Text>
                  </View>
                </View>
              </View>

              {/* Sunrise / Sunset (approx — fixed) */}
              <View style={styles.card}>
                <View style={styles.row2}>
                  <View style={styles.col}>
                    <Ionicons name="sunny" size={22} color="#F57C00" />
                    <Text style={styles.keyLabel}>{tr(lang, 'sunrise')}</Text>
                    <Text style={styles.keyValue}>6:24 AM</Text>
                  </View>
                  <View style={styles.vsep} />
                  <View style={styles.col}>
                    <Ionicons name="moon" size={22} color="#5E35B1" />
                    <Text style={styles.keyLabel}>{tr(lang, 'sunset')}</Text>
                    <Text style={styles.keyValue}>6:12 PM</Text>
                  </View>
                </View>
                <Text style={styles.keySubMuted}>Approx. for Hyderabad · IST</Text>
              </View>

              {/* Month + Season */}
              <View style={styles.card}>
                <View style={styles.rowMeta}>
                  <Text style={styles.keyLabel}>{tr(lang, 'masam')}</Text>
                  <Text style={styles.keyValueRight}>{trMasam(lang, selected.masam)}</Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text style={styles.keyLabel}>{tr(lang, 'rutuvu')}</Text>
                  <Text style={styles.keyValueRight}>{trRutuvu(lang, selected.rutuvu)}</Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text style={styles.keyLabel}>{tr(lang, 'ayanam')}</Text>
                  <Text style={styles.keyValueRight}>{trAyanam(lang, selected.ayanam)}</Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 10, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  brand: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.4 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.5)',
  },
  langBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  monthTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  monthSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },

  weekRow: { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 1, borderBottomWidth: 0, borderColor: theme.colors.border },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: theme.colors.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1, padding: 4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: '#F0E5D8',
  },
  cellMuted: { backgroundColor: '#FAFAFA' },
  cellToday: { backgroundColor: theme.colors.primary },
  cellFest: { backgroundColor: '#E53935' },
  cellNum: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  ring: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#616161', marginTop: 3 },
  black: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#222', marginTop: 3 },
  tag: { width: 12, height: 12, borderRadius: 3 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12, paddingHorizontal: 4 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legText: { fontSize: 12, color: theme.colors.textMuted },

  vratamBox: { marginTop: 20, backgroundColor: '#fff', borderRadius: 14, padding: 0, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  vratamTitle: { fontSize: 15, fontWeight: '700', color: '#fff', textAlign: 'center', backgroundColor: theme.colors.primary, paddingVertical: 10 },
  vratamGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  vratamCell: { width: '50%', padding: 10, borderWidth: 0.5, borderColor: '#F0E5D8' },
  vratamName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  vratamDays: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },

  // Language sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20, paddingHorizontal: 16, paddingTop: 10 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', alignSelf: 'center', borderRadius: 2, marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12, textAlign: 'center' },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
  langRowActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(139,21,21,0.05)' },
  langNative: { fontSize: 16, fontWeight: '700', color: theme.colors.text, flex: 1 },
  langLabel: { fontSize: 13, color: theme.colors.textMuted, marginRight: 8 },
  sheetClose: { marginTop: 6, paddingVertical: 12, alignItems: 'center' },
  sheetCloseText: { color: theme.colors.primary, fontWeight: '700', fontSize: 15 },

  // Day detail
  detailHeader: { paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  detailBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  detailDate: { color: '#fff', fontSize: 20, fontWeight: '700' },
  detailWeek: { color: '#FDE7E7', fontSize: 13, marginTop: 2 },

  heroCard: { backgroundColor: theme.colors.primary, borderRadius: 16, padding: 16, marginBottom: 14, alignItems: 'center' },
  heroLabel: { color: '#FDE7E7', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  heroMain: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 6 },
  heroSub: { color: '#FDE7E7', fontSize: 13, marginTop: 4 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardHead: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  festRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  festText: { fontSize: 15, color: theme.colors.text, fontWeight: '600' },

  vratamChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(212,175,55,0.2)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
  chipText: { color: theme.colors.secondaryDark, fontWeight: '700', fontSize: 12 },

  row2: { flexDirection: 'row', alignItems: 'center' },
  col: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  vsep: { width: 1, height: 60, backgroundColor: theme.colors.border },
  keyLabel: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  keyValue: { fontSize: 17, color: theme.colors.text, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  keySub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  keySubMuted: { fontSize: 11, color: theme.colors.textMuted, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  keyValueRight: { fontSize: 14, color: theme.colors.text, fontWeight: '700' },
  rowMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
});
