import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import {
  DIFFICULTY_LIST,
  validNickname,
  type Difficulty,
  type LeaderboardEntry,
  type Palette,
} from '@memory/core';
import { api, googleWebClientId } from '../api';
import { errorText, type useAccount } from '../hooks/useAccount';
import type { T } from '../hooks/useSettings';
import { Sheet } from './Dialogs';
import { Button, Segmented } from './ui';

let googleConfigured = false;
function configureGoogle() {
  if (!googleConfigured && googleWebClientId) {
    GoogleSignin.configure({ webClientId: googleWebClientId });
    googleConfigured = true;
  }
}

interface AccountProps {
  visible: boolean;
  account: ReturnType<typeof useAccount>;
  palette: Palette;
  t: T;
  onClose: () => void;
}

export function AccountDialog({ visible, account, palette, t, onClose }: AccountProps) {
  const { user } = account;
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, after?: () => void) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      after?.();
    } catch (e) {
      setError(errorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const google = () =>
    run(async () => {
      configureGoogle();
      await GoogleSignin.hasPlayServices();
      const res = await GoogleSignin.signIn();
      if (isSuccessResponse(res) && res.data.idToken) {
        await account.signInGoogle(res.data.idToken);
      }
    });

  const canSubmit = validNickname(nickname) && !busy;
  const input = [
    styles.input,
    { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
  ];

  return (
    <Sheet visible={visible} palette={palette} onClose={onClose}>
      <Text style={[styles.title, { color: palette.text }]}>{t('account')}</Text>
      {user ? (
        <>
          <Text style={{ color: palette.text }}>
            {t('signedInAs')} <Text style={styles.bold}>{user.nickname}</Text>
          </Text>
          <Text style={[styles.label, { color: palette.text }]}>{t('nickname')}</Text>
          <View style={styles.row}>
            <TextInput
              style={input}
              value={nickname}
              placeholder={user.nickname}
              placeholderTextColor={palette.textMuted}
              maxLength={20}
              onChangeText={setNickname}
            />
            <Button
              label={t('save')}
              palette={palette}
              disabled={!canSubmit}
              onPress={() => run(() => account.rename(nickname), () => setNickname(''))}
            />
          </View>
          {user.hasGoogle ? (
            <Text style={{ color: palette.textMuted }}>✔ {t('googleLinked')}</Text>
          ) : (
            googleWebClientId !== '' && (
              <View style={styles.row}>
                <Button label={t('linkGoogle')} palette={palette} disabled={busy} onPress={google} />
              </View>
            )
          )}
          {error !== '' && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}
          <View style={styles.row}>
            <Button label={t('signOut')} palette={palette} onPress={() => run(account.signOut, onClose)} />
          </View>
        </>
      ) : (
        <>
          <Text style={{ color: palette.textMuted }}>{t('accountHint')}</Text>
          <Text style={[styles.label, { color: palette.text }]}>{t('nickname')}</Text>
          <TextInput
            style={input}
            value={nickname}
            maxLength={20}
            placeholderTextColor={palette.textMuted}
            onChangeText={setNickname}
          />
          <Text style={{ color: palette.textMuted, fontSize: 13 }}>{t('nicknameHint')}</Text>
          <View style={styles.row}>
            <Button
              label={t('continueNickname')}
              palette={palette}
              primary
              disabled={!canSubmit}
              onPress={() => run(() => account.signInGuest(nickname), () => setNickname(''))}
            />
          </View>
          {googleWebClientId !== '' && (
            <View style={styles.row}>
              <Button label={t('signInGoogle')} palette={palette} disabled={busy} onPress={google} />
            </View>
          )}
          {error !== '' && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}
        </>
      )}
      {busy && <ActivityIndicator color={palette.primary} />}
      <View style={styles.row}>
        <Button label={t('close')} palette={palette} onPress={onClose} />
      </View>
    </Sheet>
  );
}

interface BoardProps {
  visible: boolean;
  initial: Difficulty;
  userId: string | undefined;
  palette: Palette;
  t: T;
  onClose: () => void;
}

export function LeaderboardDialog({ visible, initial, userId, palette, t, onClose }: BoardProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initial);
  const [state, setState] = useState<{ key: string; entries?: LeaderboardEntry[]; error?: string }>({ key: '' });

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    api
      .leaderboard(difficulty)
      .then(entries => !cancelled && setState({ key: difficulty, entries }))
      .catch(e => !cancelled && setState({ key: difficulty, error: errorText(e, t) }));
    return () => {
      cancelled = true;
    };
  }, [visible, difficulty, t]);

  const ready = state.key === difficulty;
  return (
    <Sheet visible={visible} palette={palette} onClose={onClose}>
      <Text style={[styles.title, { color: palette.text }]}>🏆 {t('leaderboard')}</Text>
      <Segmented
        options={DIFFICULTY_LIST.map(d => ({ value: d, label: t(d) }))}
        value={difficulty}
        palette={palette}
        onChange={setDifficulty}
      />
      {!ready && <ActivityIndicator color={palette.primary} />}
      {ready && state.error !== undefined && (
        <Text style={[styles.error, { color: palette.danger }]}>{state.error}</Text>
      )}
      {ready && state.entries?.length === 0 && <Text style={{ color: palette.textMuted }}>{t('noScores')}</Text>}
      {ready &&
        state.entries?.map(e => (
          <View
            key={e.userId}
            style={[
              styles.leader,
              { backgroundColor: palette.surfaceAlt },
              e.userId === userId && { borderColor: palette.primary, borderWidth: 2 },
            ]}
          >
            <Text style={[styles.rank, { color: palette.textMuted }]}>{e.rank}</Text>
            <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
              {e.nickname}
              {e.userId === userId ? ` (${t('you')})` : ''}
            </Text>
            <Text style={[styles.bold, { color: palette.text }]}>{e.points}</Text>
          </View>
        ))}
      <View style={styles.row}>
        <Button label={t('close')} palette={palette} onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  label: { fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  error: { textAlign: 'center', fontWeight: '600' },
  bold: { fontWeight: '800' },
  leader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10 },
  rank: { width: 28, fontWeight: '800' },
  name: { flex: 1 },
});
