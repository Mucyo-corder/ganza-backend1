import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {GanzaHeader} from '../../components/premium/GanzaHeader';
import {AmbientBackground} from '../../components/premium/AmbientBackground';
import {GlassCard} from '../../components/premium/GlassCard';
import {StatusPill} from '../../components/premium/StatusPill';
import {PremiumButton} from '../../components/premium/PremiumButton';
import {SPACING} from '../../constants/theme';

type TaskStatus = 'active' | 'queued' | 'done' | 'error';

interface Task {
  id: string;
  title: string;
  desc: string;
  status: TaskStatus;
  progress?: number;
  device: 'telephone' | 'computer' | 'both';
  time: string;
}

const MOCK_TASKS: Task[] = [
  {id: '1', title: 'Gusuzuma imbaho 14', desc: 'AI Vision • Scan • Kubara automatic', status: 'active', progress: 72, device: 'telephone', time: 'now'},
  {id: '2', title: 'Sync ububiko', desc: 'Telephone ↔ Computer • Cloud', status: 'active', progress: 45, device: 'both', time: 'now'},
  {id: '3', title: 'Raporo y\'ukwezi', desc: 'Kora PDF • Kohereza kuri email', status: 'queued', device: 'computer', time: 'in 12 min'},
  {id: '4', title: 'Kumenyesha abakiriya 3', desc: 'WhatsApp • SMS • Automatic', status: 'queued', device: 'telephone', time: 'queued'},
  {id: '5', title: 'Gusukura cache', desc: 'Kuvugurura system • Auto-maintenance', status: 'done', device: 'both', time: '2h ago'},
  {id: '6', title: 'Kubika backup', desc: 'Cloud • Encrypted • Daily', status: 'done', device: 'computer', time: 'yesterday'},
];

export default function TasksScreen({navigation}: {navigation: {navigate: (s: string) => void; goBack: () => void}}) {
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const filtered = filter === 'all' ? MOCK_TASKS : MOCK_TASKS.filter(t => t.status === filter);

  return (
    <AmbientBackground>
      <GanzaHeader variant="compact" onNotificationPress={() => navigation.navigate('Notifications')} onProfilePress={() => navigation.navigate('Profile')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Imirimo</Text>
            <Text style={styles.subtitle}>AI Agent irimo kubikora — 2 active • 2 queued</Text>
          </View>
          <View style={styles.titleBadge}>
            <View style={styles.titleDot} />
            <Text style={styles.titleBadgeText}>Live</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{paddingRight: 16}}>
          {(['all', 'active', 'queued', 'done'] as const).map(f => (
            <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.85}>
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f === 'all' ? 'Byose' : f === 'active' ? 'Bikora' : f === 'queued' ? 'Queued' : 'Byarangiye'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Automation insight */}
        <GlassCard variant="luminous" style={{marginBottom: 14}} padding="md">
          <View style={styles.insightRow}>
            <View style={styles.insightIconBox}><Text style={styles.insightIcon}>✦</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.insightTitle}>Automation Insight</Text>
              <Text style={styles.insightDesc}>GANZA izakorera 84% y'imirimo isanzwe — wowe wibande ku by'ingenzi gusa.</Text>
            </View>
            <Text style={styles.insightPercent}>84%</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, {width: '84%'}]} /></View>
        </GlassCard>

        {filtered.map(task => (
          <GlassCard key={task.id} style={styles.taskCard} padding="md">
            <View style={styles.taskHeader}>
              <View style={styles.taskLeft}>
                <View style={[styles.taskIconBox, task.status === 'active' && styles.taskIconActive, task.status === 'done' && styles.taskIconDone]}>
                  <Text style={styles.taskIcon}>{task.status === 'active' ? '◈' : task.status === 'done' ? '✓' : task.status === 'error' ? '!' : '⬡'}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDesc}>{task.desc}</Text>
                </View>
              </View>
              <StatusPill
                status={task.status === 'active' ? 'busy' : task.status === 'done' ? 'success' : task.status === 'error' ? 'error' : 'idle'}
                label={task.status === 'active' ? 'Active' : task.status === 'queued' ? 'Queued' : task.status === 'done' ? 'Done' : 'Error'}
              />
            </View>

            {task.progress !== undefined && (
              <View style={styles.taskProgress}>
                <View style={styles.taskProgressTrack}><View style={[styles.taskProgressFill, {width: `${task.progress}%`}]} /></View>
                <Text style={styles.taskProgressText}>{task.progress}%</Text>
              </View>
            )}

            <View style={styles.taskFooter}>
              <View style={styles.taskMetaRow}>
                <View style={styles.devicePill}>
                  <View style={[styles.deviceDot, task.device === 'telephone' ? styles.dotBlue : task.device === 'computer' ? styles.dotCyan : styles.dotGreen]} />
                  <Text style={styles.deviceText}>{task.device === 'telephone' ? 'Telephone' : task.device === 'computer' ? 'Computer' : 'Both'}</Text>
                </View>
                <Text style={styles.taskTime}>{task.time}</Text>
              </View>
              {task.status === 'active' && (
                <TouchableOpacity style={styles.taskAction}>
                  <Text style={styles.taskActionText}>Reba</Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        ))}

        <GlassCard title="Shyiraho umurimo mushya" subtitle="Tegeka AI Agent" icon="✦" style={{marginTop: 8}}>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
              <Text style={styles.quickIcon}>⬢</Text>
              <Text style={styles.quickText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
              <Text style={styles.quickIcon}>▭</Text>
              <Text style={styles.quickText}>Raporo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
              <Text style={styles.quickIcon}>⬡</Text>
              <Text style={styles.quickText}>Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} activeOpacity={0.85}>
              <Text style={styles.quickIcon}>◆</Text>
              <Text style={styles.quickText}>Gurisha</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={{height: 100}} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {padding: SPACING.md, paddingTop: 12},
  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14},
  title: {fontSize: 26, fontWeight: '900', color: '#F1F6FF', letterSpacing: -0.6},
  subtitle: {fontSize: 12, color: '#8FA2BB', marginTop: 4, fontWeight: '500'},
  titleBadge: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.20)'},
  titleDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6},
  titleBadgeText: {fontSize: 11, fontWeight: '800', color: '#6EE7B7', letterSpacing: 0.5, textTransform: 'uppercase'},
  filters: {marginBottom: 14, flexGrow: 0},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginRight: 8},
  chipActive: {backgroundColor: '#3B82F6', borderColor: '#60A5FA'},
  chipText: {fontSize: 12, fontWeight: '700', color: '#8FA2BB'},
  chipTextActive: {color: '#fff'},
  insightRow: {flexDirection: 'row', alignItems: 'center'},
  insightIconBox: {width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  insightIcon: {fontSize: 14, color: '#93C5FD'},
  insightTitle: {fontSize: 12, fontWeight: '800', color: '#EAF2FD', letterSpacing: 0.4, textTransform: 'uppercase'},
  insightDesc: {fontSize: 11, color: '#8FA2BB', marginTop: 2, lineHeight: 14},
  insightPercent: {fontSize: 20, fontWeight: '900', color: '#60A5FA', marginLeft: 10},
  progressTrack: {height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 12, overflow: 'hidden'},
  progressFill: {height: '100%', backgroundColor: '#60A5FA', borderRadius: 4},
  taskCard: {marginBottom: 10},
  taskHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  taskLeft: {flexDirection: 'row', flex: 1, marginRight: 10},
  taskIconBox: {width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  taskIconActive: {backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(96,165,250,0.20)'},
  taskIconDone: {backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.16)'},
  taskIcon: {fontSize: 13, color: '#EAF2FD', fontWeight: '700'},
  taskTitle: {fontSize: 13, fontWeight: '700', color: '#F1F6FF'},
  taskDesc: {fontSize: 11, color: '#8FA2BB', marginTop: 2},
  taskProgress: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  taskProgressTrack: {flex: 1, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginRight: 8},
  taskProgressFill: {height: '100%', backgroundColor: '#60A5FA', borderRadius: 4},
  taskProgressText: {fontSize: 11, fontWeight: '800', color: '#93C5FD'},
  taskFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12},
  taskMetaRow: {flexDirection: 'row', alignItems: 'center'},
  devicePill: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginRight: 8},
  deviceDot: {width: 5, height: 5, borderRadius: 2.5, marginRight: 5},
  dotBlue: {backgroundColor: '#60A5FA'},
  dotCyan: {backgroundColor: '#38BDF8'},
  dotGreen: {backgroundColor: '#10B981'},
  deviceText: {fontSize: 10, fontWeight: '700', color: '#CBD8E6', letterSpacing: 0.3, textTransform: 'uppercase'},
  taskTime: {fontSize: 11, color: '#6B84A0'},
  taskAction: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(96,165,250,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.18)'},
  taskActionText: {fontSize: 11, fontWeight: '700', color: '#93C5FD'},
  quickGrid: {flexDirection: 'row', justifyContent: 'space-between'},
  quickAction: {flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginHorizontal: 4},
  quickIcon: {fontSize: 16, color: '#CBD8E6', marginBottom: 6},
  quickText: {fontSize: 11, fontWeight: '700', color: '#EAF2FD'},
});
