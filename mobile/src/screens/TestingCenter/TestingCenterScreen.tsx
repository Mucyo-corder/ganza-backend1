import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator} from 'react-native';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {StatusPill} from '../../components/premium/StatusPill';
import {SPACING} from '../../constants/theme';
import {TestingService} from '../../services/AgentService';

type DeviceOpt = 'phone' | 'desktop' | 'cloud' | 'any';
type TargetOpt = 'app' | 'browser' | 'filesystem' | 'terminal' | 'system';
type ModeOpt = 'OBSERVE_ONLY' | 'DRY_RUN' | 'SANDBOX' | 'EXECUTE' | 'REPLAY';

export default function TestingCenterScreen({navigation}: {navigation: {navigate: (s: string) => void}}) {
  const [device, setDevice] = useState<DeviceOpt>('phone');
  const [target, setTarget] = useState<TargetOpt>('app');
  const [goal, setGoal] = useState('Open Chrome and search for GANZA');
  const [expected, setExpected] = useState('Search results page is visible');
  const [mode, setMode] = useState<ModeOpt>('EXECUTE');
  const [cases, setCases] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);

  useEffect(() => {
    loadCases();
    loadRuns();
  }, []);

  const loadCases = async () => {
    try {const c = await TestingService.listCases(); setCases(c);} catch (e) { console.warn('listCases failed', e);}
  };
  const loadRuns = async () => {
    try {const r = await TestingService.listRuns(); setRuns(r);} catch {}
  };

  const startTest = async () => {
    if (!goal.trim() || !expected.trim()) {
      Alert.alert('Ikibazo', 'Uzuza Goal na Expected result');
      return;
    }
    setLoading(true);
    try {
      const created = await TestingService.createCase({
        name: goal.slice(0, 40),
        goal,
        device,
        target,
        mode,
        expectedResult: expected,
        maxSteps: 10,
        timeoutMs: 60000,
        riskLevel: mode === 'EXECUTE' ? 'medium' : 'low',
        permissions: [],
      });
      const run = await TestingService.runCase(created.id);
      setSelectedRun(run);
      await loadCases();
      await loadRuns();
      Alert.alert('Test Result', `Status: ${run.status}\nEvidence: ${run.evidence?.length ?? 0} steps`);
    } catch (e: any) {
      Alert.alert('Test Failed', String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  const renderEvidence = (run: any) => (
    <View style={{marginTop: 8}}>
      <Text style={styles.evidenceTitle}>VERIFICATION SCORE: {run.evidence?.filter((e: any) => e.verification?.success).length ?? 0}/{run.evidence?.length ?? 0}</Text>
      {(run.steps ?? []).map((s: any, i: number) => (
        <View key={s.id ?? i} style={[styles.stepRow, s.verification?.success ? styles.stepSuccess : styles.stepFail]}>
          <Text style={styles.stepIcon}>{s.verification?.success ? '✓' : '✗'}</Text>
          <View style={{flex: 1}}>
            <Text style={styles.stepAction}>{s.action} {s.target ? `→ ${s.target}` : ''}</Text>
            <Text style={styles.stepExpected}>Expected: {s.verification?.expected ?? s.action}</Text>
            {!s.verification?.success && <Text style={styles.stepReason}>{s.verification?.reason ?? 'Not verified'}</Text>}
          </View>
        </View>
      ))}
      {run.evidence?.map((ev: any, i: number) => (
        <View key={i} style={styles.evidenceChip}>
          <Text style={styles.evidenceChipText}>{ev.action} • tool: {String(ev.toolResult ?? '').slice(0, 40)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Testing Center</Text>
          <StatusPill status="busy" label="Source of Truth" />
        </View>
        <Text style={styles.subtitle}>Kora test • Verify with evidence • Shyira automation gusa niba PASSED</Text>

        <GlassCard title="DEVICE" subtitle="Hitamo igikoresho" icon="⬢" style={{marginBottom: 12}}>
          <View style={styles.chipRow}>
            {(['phone', 'desktop', 'cloud', 'any'] as DeviceOpt[]).map(d => (
              <TouchableOpacity key={d} style={[styles.chip, device === d && styles.chipActive]} onPress={() => setDevice(d)} activeOpacity={0.85}>
                <Text style={[styles.chipText, device === d && styles.chipTextActive]}>{d === 'phone' ? 'Android Phone' : d === 'desktop' ? 'Windows PC' : d === 'cloud' ? 'Cloud' : 'Any'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard title="TARGET" subtitle="Aho action izakorerwa" icon="◈" style={{marginBottom: 12}}>
          <View style={styles.chipRow}>
            {(['app', 'browser', 'filesystem', 'terminal'] as TargetOpt[]).map(t => (
              <TouchableOpacity key={t} style={[styles.chip, target === t && styles.chipActive]} onPress={() => setTarget(t)} activeOpacity={0.85}>
                <Text style={[styles.chipText, target === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard title="TASK" subtitle="Goal • Expected result" icon="✦" style={{marginBottom: 12}}>
          <Text style={styles.label}>TASK (Goal)</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="Open Chrome and search for GANZA" placeholderTextColor="#5E728C" multiline />
          </View>
          <Text style={[styles.label, {marginTop: 12}]}>EXPECTED RESULT</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} value={expected} onChangeText={setExpected} placeholder="Search results page is visible" placeholderTextColor="#5E728C" multiline />
          </View>
        </GlassCard>

        <GlassCard title="MODE" subtitle="Uburyo test izakorwa" icon="⬡" style={{marginBottom: 12}}>
          <View style={styles.chipRowWrap}>
            {(['OBSERVE_ONLY', 'DRY_RUN', 'SANDBOX', 'EXECUTE', 'REPLAY'] as ModeOpt[]).map(m => (
              <TouchableOpacity key={m} style={[styles.chip, mode === m && styles.chipActive, mode === 'EXECUTE' && m === 'EXECUTE' ? styles.chipPrimary : null]} onPress={() => setMode(m)} activeOpacity={0.85}>
                <Text style={[styles.chipText, mode === m && styles.chipTextActive]}>{m.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modeHint}>
            <Text style={styles.modeHintText}>
              {mode === 'OBSERVE_ONLY' ? 'Observe only — no execution, NOT_VERIFIED.' : mode === 'DRY_RUN' ? 'Dry run — plan validated, no execution.' : mode === 'SANDBOX' ? 'Sandbox — safe isolated execution.' : mode === 'EXECUTE' ? 'Execute — real execution with verification.' : 'Replay — rerun previous evidence.'}
            </Text>
          </View>
        </GlassCard>

        <GlassCard title="VERIFICATION" subtitle="Evidence required for PASS" icon="▭" style={{marginBottom: 12}}>
          {[
            'Screenshot',
            'UI state',
            'Tool result',
            'Expected state',
          ].map(v => (
            <View key={v} style={styles.verifyRow}>
              <View style={styles.verifyCheck}><Text style={styles.verifyCheckText}>✓</Text></View>
              <Text style={styles.verifyText}>{v}</Text>
            </View>
          ))}
          <Text style={styles.verifyHint}>Hard rule: Nta evidence → nta PASSED. Verification must be success.</Text>
        </GlassCard>

        <PremiumButton title={loading ? 'Testing...' : 'START TEST'} onPress={startTest} size="lg" loading={loading} icon="✦" style={{marginBottom: 16}} />

        {selectedRun && (
          <GlassCard
            title={`TASK RESULT — ${selectedRun.status}`}
            subtitle={`Evidence: ${selectedRun.evidence?.length ?? 0} • Steps: ${selectedRun.steps?.length ?? 0}`}
            icon={selectedRun.status === 'PASSED' ? '✓' : '✗'}
            variant={selectedRun.status === 'PASSED' ? 'luminous' : selectedRun.status === 'FAILED' ? 'accent' : 'default'}
            style={{marginBottom: 12}}
          >
            <Text style={[styles.resultStatus, selectedRun.status === 'PASSED' ? styles.resultPass : styles.resultFail]}>FINAL: {selectedRun.status}</Text>
            {selectedRun.error ? <Text style={styles.resultError}>{selectedRun.error}</Text> : null}
            {renderEvidence(selectedRun)}
          </GlassCard>
        )}

        <GlassCard title="Test Cases" subtitle={`${cases.length} cases • Source of truth`} icon="⬣" style={{marginBottom: 12}}>
          {cases.length === 0 ? <Text style={styles.empty}>Nta test case irabaho — kora ya mbere.</Text> : cases.slice(0, 5).map((c: any) => (
            <TouchableOpacity key={c.id} style={styles.caseRow} onPress={async () => {try {const r = await TestingService.runCase(c.id); setSelectedRun(r); await loadRuns();} catch (e: any) {Alert.alert('Run failed', String(e.message));}}} activeOpacity={0.85}>
              <View style={styles.caseIconBox}><Text style={styles.caseIcon}>✦</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.caseName} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.caseGoal} numberOfLines={1}>{c.goal} • {c.device}</Text>
              </View>
              <StatusPill status={c.enabled ? 'success' : 'idle'} label={c.mode} />
            </TouchableOpacity>
          ))}
        </GlassCard>

        <GlassCard title="Recent Runs" subtitle={`${runs.length} runs`} icon="◈">
          {runs.length === 0 ? <Text style={styles.empty}>Nta run irabaho.</Text> : runs.slice(0, 5).map((r: any) => (
            <TouchableOpacity key={r.id} style={styles.runRow} onPress={() => setSelectedRun(r)} activeOpacity={0.85}>
              <View style={[styles.runDot, r.status === 'PASSED' ? styles.runDotPass : r.status === 'FAILED' ? styles.runDotFail : styles.runDotOther]} />
              <View style={{flex: 1}}>
                <Text style={styles.runName}>{r.testId.slice(0, 12)} • {r.status}</Text>
                <Text style={styles.runMeta}>{new Date(r.startedAt).toLocaleString()} • {r.steps?.length ?? 0} steps</Text>
              </View>
              <Text style={styles.runArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </GlassCard>

        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 12},
  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, marginBottom: 14, lineHeight: 16},
  label: {fontSize: 10, fontWeight: '800', color: '#8FA2BB', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 6},
  inputWrap: {backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4},
  input: {color: '#F1F6FF', fontSize: 13, fontWeight: '500', minHeight: 40, textAlignVertical: 'top'},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap'},
  chipRowWrap: {flexDirection: 'row', flexWrap: 'wrap'},
  chip: {paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginRight: 8, marginBottom: 8},
  chipActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.22)'},
  chipPrimary: {backgroundColor: '#3B82F6', borderColor: '#60A5FA'},
  chipText: {fontSize: 12, fontWeight: '700', color: '#8FA2BB'},
  chipTextActive: {color: '#EAF2FD'},
  modeHint: {marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'},
  modeHintText: {fontSize: 11, color: '#8FA2BB', lineHeight: 14},
  verifyRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 6},
  verifyCheck: {width: 22, height: 22, borderRadius: 7, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  verifyCheckText: {fontSize: 11, color: '#6EE7B7', fontWeight: '800'},
  verifyText: {fontSize: 12, fontWeight: '600', color: '#EAF2FD'},
  verifyHint: {fontSize: 11, color: '#FCD34D', marginTop: 8, lineHeight: 14, fontWeight: '600'},
  resultStatus: {fontSize: 16, fontWeight: '900', letterSpacing: 0.6},
  resultPass: {color: '#6EE7B7'},
  resultFail: {color: '#FCA5A5'},
  resultError: {fontSize: 12, color: '#FCA5A5', marginTop: 6, lineHeight: 14},
  evidenceTitle: {fontSize: 11, fontWeight: '800', color: '#8FA2BB', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8},
  stepRow: {flexDirection: 'row', padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 6},
  stepSuccess: {backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.14)'},
  stepFail: {backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.14)'},
  stepIcon: {fontSize: 12, fontWeight: '800', marginRight: 8, marginTop: 1},
  stepAction: {fontSize: 12, fontWeight: '700', color: '#F1F6FF'},
  stepExpected: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  stepReason: {fontSize: 11, color: '#FCA5A5', marginTop: 4, fontWeight: '600'},
  evidenceChip: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 6, alignSelf: 'flex-start'},
  evidenceChipText: {fontSize: 10, color: '#8FA2BB'},
  caseRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  caseIconBox: {width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.16)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  caseIcon: {fontSize: 12, color: '#93C5FD'},
  caseName: {fontSize: 13, fontWeight: '700', color: '#F1F6FF'},
  caseGoal: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  runRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'},
  runDot: {width: 8, height: 8, borderRadius: 4, marginRight: 10},
  runDotPass: {backgroundColor: '#10B981'},
  runDotFail: {backgroundColor: '#EF4444'},
  runDotOther: {backgroundColor: '#6B84A0'},
  runName: {fontSize: 12, fontWeight: '700', color: '#F1F6FF'},
  runMeta: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  runArrow: {fontSize: 14, color: '#6B84A0', fontWeight: '700'},
  empty: {fontSize: 12, color: '#8FA2BB', textAlign: 'center', padding: 12},
});
