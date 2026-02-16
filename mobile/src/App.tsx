import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type User = { id: string; email: string };
type ProductMatch = {
  id: string;
  productName: string;
  category: string;
  confidence: number;
  commission: number;
  shopeeUrl: string;
};
type Account = { id: string; username: string; dailyLimit: number; active: boolean };
type Creator = {
  id: string;
  tiktokUsername: string;
  autoCheck: boolean;
  lastCheckedAt?: string | null;
};
type Video = {
  id: string;
  sourceUrl: string;
  status: string;
  watermarkRemoved: boolean;
  importedAt?: string;
  productMatch?: ProductMatch | null;
};
type DashboardSummary = {
  totals: {
    totalVideos: number;
    matchedVideos: number;
    needsReview: number;
    postsToday: number;
    profitTotal: number;
  };
  accountStats: Array<{
    accountId: string;
    username: string;
    active: boolean;
    dailyLimit: number;
    postsToday: number;
    profitTotal: number;
  }>;
  recentPosts: Array<{
    id: string;
    postedAt: string;
    account: string;
    product: string;
    confidence: number | null;
    affiliateLink: string;
    estimatedProfit: number;
  }>;
};

type Tab = "auth" | "accounts" | "creators" | "videos" | "review" | "dashboard";

function extractError(message: unknown): string {
  if (typeof message === "string") return message;
  if (message && typeof message === "object") return JSON.stringify(message);
  return "Unknown error";
}

export default function App() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:4000");
  const [tab, setTab] = useState<Tab>("auth");

  const [email, setEmail] = useState("demo@shopeepilot.com");
  const [password, setPassword] = useState("password123");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [accountUsername, setAccountUsername] = useState("shop_account_1");
  const [dailyLimit, setDailyLimit] = useState("5");
  const [accountActive, setAccountActive] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [creatorUsername, setCreatorUsername] = useState("@testcreator");
  const [creatorAutoCheck, setCreatorAutoCheck] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);

  const [videoUrl, setVideoUrl] = useState("https://www.tiktok.com/@test/video/123456789");
  const [videos, setVideos] = useState<Video[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Video[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  const isLoggedIn = Boolean(token);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  function buildAuthHeaders(tokenOverride?: string) {
    const activeToken = tokenOverride ?? token;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${activeToken}`,
    };
  }

  async function callApi(path: string, options?: RequestInit) {
    const res = await fetch(`${baseUrl}${path}`, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ? extractError(body.error) : `Request failed: ${res.status}`);
    return body;
  }

  async function hydrateCoreData(tokenOverride?: string) {
    await Promise.all([
      loadAccounts(tokenOverride),
      loadCreators(tokenOverride),
      loadVideos(tokenOverride),
      loadReviewQueue(tokenOverride),
      loadDashboard(tokenOverride),
    ]);
  }

  async function onRegister() {
    try {
      setAuthLoading(true);
      const data = await callApi("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUser(data.user);
      setTab("accounts");
      Alert.alert("Success", "Registered and logged in.");
      await hydrateCoreData(data.token);
    } catch (e) {
      Alert.alert("Register failed", extractError((e as Error).message));
    } finally {
      setAuthLoading(false);
    }
  }

  async function onLogin() {
    try {
      setAuthLoading(true);
      const data = await callApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUser(data.user);
      setTab("accounts");
      Alert.alert("Success", "Logged in.");
      await hydrateCoreData(data.token);
    } catch (e) {
      Alert.alert("Login failed", extractError((e as Error).message));
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadAccounts(tokenOverride?: string) {
    if (!tokenOverride && !isLoggedIn) return;
    try {
      const data = await callApi("/accounts", { headers: buildAuthHeaders(tokenOverride) });
      setAccounts(data);
    } catch (e) {
      Alert.alert("Load accounts failed", extractError((e as Error).message));
    }
  }

  async function addAccount() {
    if (!isLoggedIn) return;
    const limit = Number(dailyLimit);
    if (!accountUsername.trim() || !Number.isFinite(limit) || limit <= 0) {
      Alert.alert("Validation", "Enter username and daily limit > 0");
      return;
    }

    try {
      await callApi("/accounts", {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ username: accountUsername, dailyLimit: limit, active: accountActive }),
      });
      setAccountUsername("");
      await loadAccounts();
      await loadDashboard();
    } catch (e) {
      Alert.alert("Add account failed", extractError((e as Error).message));
    }
  }

  async function loadCreators(tokenOverride?: string) {
    if (!tokenOverride && !isLoggedIn) return;
    try {
      const data = await callApi("/creators", { headers: buildAuthHeaders(tokenOverride) });
      setCreators(data);
    } catch (e) {
      Alert.alert("Load creators failed", extractError((e as Error).message));
    }
  }

  async function addCreator() {
    if (!isLoggedIn) return;
    if (!creatorUsername.trim()) {
      Alert.alert("Validation", "Enter TikTok username");
      return;
    }

    try {
      await callApi("/creators", {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ tiktokUsername: creatorUsername, autoCheck: creatorAutoCheck }),
      });
      setCreatorUsername("");
      await loadCreators();
    } catch (e) {
      Alert.alert("Add creator failed", extractError((e as Error).message));
    }
  }

  async function checkCreator(creatorId: string) {
    if (!isLoggedIn) return;
    try {
      const data = await callApi(`/creators/${creatorId}/check`, {
        method: "POST",
        headers: buildAuthHeaders(),
      });
      Alert.alert("Creator checked", `${data.videosImported} videos imported`);
      await loadCreators();
      await loadVideos();
      await loadReviewQueue();
      await loadDashboard();
    } catch (e) {
      Alert.alert("Check creator failed", extractError((e as Error).message));
    }
  }

  async function loadVideos(tokenOverride?: string) {
    if (!tokenOverride && !isLoggedIn) return;
    try {
      const data = await callApi("/videos", { headers: buildAuthHeaders(tokenOverride) });
      setVideos(data);
    } catch (e) {
      Alert.alert("Load videos failed", extractError((e as Error).message));
    }
  }

  async function intakeVideo() {
    if (!isLoggedIn) return;
    if (!videoUrl.trim()) {
      Alert.alert("Validation", "Enter TikTok video URL");
      return;
    }

    try {
      await callApi("/videos/intake", {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ sourceUrl: videoUrl }),
      });
      setVideoUrl("");
      await loadVideos();
      await loadReviewQueue();
      await loadDashboard();
    } catch (e) {
      Alert.alert("Intake failed", extractError((e as Error).message));
    }
  }

  async function loadReviewQueue(tokenOverride?: string) {
    if (!tokenOverride && !isLoggedIn) return;
    try {
      const data = await callApi("/videos/review-queue", { headers: buildAuthHeaders(tokenOverride) });
      setReviewQueue(data);
    } catch (e) {
      Alert.alert("Review queue failed", extractError((e as Error).message));
    }
  }

  async function confirmMatch(videoId: string) {
    try {
      await callApi(`/videos/${videoId}/confirm-match`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({}),
      });
      await loadVideos();
      await loadReviewQueue();
      await loadDashboard();
    } catch (e) {
      Alert.alert("Confirm failed", extractError((e as Error).message));
    }
  }

  async function reanalyze(videoId: string) {
    try {
      await callApi(`/videos/${videoId}/reanalyze`, {
        method: "POST",
        headers: buildAuthHeaders(),
      });
      await loadVideos();
      await loadReviewQueue();
      await loadDashboard();
    } catch (e) {
      Alert.alert("Re-analyze failed", extractError((e as Error).message));
    }
  }

  async function postVideo(videoId: string) {
    try {
      const data = await callApi(`/videos/${videoId}/post`, {
        method: "POST",
        headers: buildAuthHeaders(),
      });
      Alert.alert("Posted", data.message);
      await loadVideos();
      await loadReviewQueue();
      await loadDashboard();
    } catch (e) {
      Alert.alert("Post failed", extractError((e as Error).message));
    }
  }

  async function loadDashboard(tokenOverride?: string) {
    if (!tokenOverride && !isLoggedIn) return;
    try {
      const data = await callApi("/dashboard/summary", { headers: buildAuthHeaders(tokenOverride) });
      setDashboard(data);
    } catch (e) {
      Alert.alert("Dashboard failed", extractError((e as Error).message));
    }
  }

  const tabs: Tab[] = ["auth", "accounts", "creators", "videos", "review", "dashboard"];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>ShopeePilot MVP</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Backend URL (for iPhone use your PC LAN IP)</Text>
          <TextInput style={styles.input} value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" />
          <Text style={styles.helper}>Example: http://192.168.0.195:4000</Text>
        </View>

        <View style={styles.tabs}>
          {tabs.map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
              <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "auth" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1) Authentication</Text>
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <View style={styles.rowGap}>
              <Pressable style={styles.button} onPress={onRegister} disabled={authLoading}>
                <Text style={styles.buttonText}>Register</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={onLogin} disabled={authLoading}>
                <Text style={styles.buttonText}>Login</Text>
              </Pressable>
            </View>
            <Text style={styles.helper}>{isLoggedIn ? `Logged in: ${user?.email}` : "Not logged in"}</Text>
          </View>
        )}

        {tab === "accounts" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2) Shopee Accounts</Text>
            <TextInput style={styles.input} placeholder="Account username" value={accountUsername} onChangeText={setAccountUsername} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Daily limit" keyboardType="numeric" value={dailyLimit} onChangeText={setDailyLimit} />
            <View style={styles.switchRow}>
              <Text>Active</Text>
              <Switch value={accountActive} onValueChange={setAccountActive} />
            </View>
            <View style={styles.rowGap}>
              <Pressable style={styles.button} onPress={addAccount}>
                <Text style={styles.buttonText}>Add Account</Text>
              </Pressable>
              <Pressable style={styles.buttonAlt} onPress={loadAccounts}>
                <Text style={styles.buttonAltText}>Refresh</Text>
              </Pressable>
            </View>

            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.helper}>No accounts yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.itemTitle}>@{item.username}</Text>
                  <Text style={styles.helper}>Limit: {item.dailyLimit} / Active: {String(item.active)}</Text>
                </View>
              )}
            />
          </View>
        )}

        {tab === "creators" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>3) Creator Monitoring</Text>
            <TextInput style={styles.input} placeholder="TikTok username" value={creatorUsername} onChangeText={setCreatorUsername} autoCapitalize="none" />
            <View style={styles.switchRow}>
              <Text>Auto-check</Text>
              <Switch value={creatorAutoCheck} onValueChange={setCreatorAutoCheck} />
            </View>
            <View style={styles.rowGap}>
              <Pressable style={styles.button} onPress={addCreator}>
                <Text style={styles.buttonText}>Add Creator</Text>
              </Pressable>
              <Pressable style={styles.buttonAlt} onPress={loadCreators}>
                <Text style={styles.buttonAltText}>Refresh</Text>
              </Pressable>
            </View>

            <FlatList
              data={creators}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.helper}>No creators yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.itemTitle}>{item.tiktokUsername}</Text>
                  <Text style={styles.helper}>Last checked: {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleString() : "Never"}</Text>
                  <Pressable style={styles.smallButton} onPress={() => checkCreator(item.id)}>
                    <Text style={styles.smallButtonText}>Check Now</Text>
                  </Pressable>
                </View>
              )}
            />
          </View>
        )}

        {tab === "videos" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>4) Videos + Posting</Text>
            <TextInput style={styles.input} placeholder="TikTok URL" value={videoUrl} onChangeText={setVideoUrl} autoCapitalize="none" />
            <View style={styles.rowGap}>
              <Pressable style={styles.button} onPress={intakeVideo}>
                <Text style={styles.buttonText}>Import Video URL</Text>
              </Pressable>
              <Pressable style={styles.buttonAlt} onPress={loadVideos}>
                <Text style={styles.buttonAltText}>Refresh</Text>
              </Pressable>
            </View>

            <FlatList
              data={videos}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.helper}>No videos yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text numberOfLines={1} style={styles.itemTitle}>{item.sourceUrl}</Text>
                  <Text style={styles.helper}>Status: {item.status} • Product: {item.productMatch?.productName ?? "Pending"}</Text>
                  <Text style={styles.helper}>Confidence: {item.productMatch?.confidence ?? "-"}% • Commission: {item.productMatch?.commission ?? "-"}%</Text>
                  {item.status === "ready" && (
                    <Pressable style={styles.smallButton} onPress={() => postVideo(item.id)}>
                      <Text style={styles.smallButtonText}>Post Now</Text>
                    </Pressable>
                  )}
                </View>
              )}
            />
          </View>
        )}

        {tab === "review" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>5) Review Queue</Text>
            <Pressable style={styles.buttonAlt} onPress={loadReviewQueue}>
              <Text style={styles.buttonAltText}>Refresh Queue</Text>
            </Pressable>

            <FlatList
              data={reviewQueue}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.helper}>No low-confidence videos. ✅</Text>}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text numberOfLines={1} style={styles.itemTitle}>{item.productMatch?.productName ?? "Unknown Product"}</Text>
                  <Text style={styles.helper}>Confidence: {item.productMatch?.confidence ?? "-"}%</Text>
                  <View style={styles.rowGap}>
                    <Pressable style={styles.smallButton} onPress={() => confirmMatch(item.id)}>
                      <Text style={styles.smallButtonText}>Confirm Match</Text>
                    </Pressable>
                    <Pressable style={styles.smallButtonWarn} onPress={() => reanalyze(item.id)}>
                      <Text style={styles.smallButtonWarnText}>Re-analyze</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {tab === "dashboard" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>6) Dashboard</Text>
            <Pressable style={styles.buttonAlt} onPress={loadDashboard}>
              <Text style={styles.buttonAltText}>Refresh Dashboard</Text>
            </Pressable>

            {dashboard ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.helper}>Total Videos: {dashboard.totals.totalVideos}</Text>
                <Text style={styles.helper}>Matched Videos: {dashboard.totals.matchedVideos}</Text>
                <Text style={styles.helper}>Needs Review: {dashboard.totals.needsReview}</Text>
                <Text style={styles.helper}>Posts Today: {dashboard.totals.postsToday}</Text>
                <Text style={styles.helper}>Estimated Profit Total: ${dashboard.totals.profitTotal}</Text>

                <Text style={styles.itemTitle}>Account Stats</Text>
                {dashboard.accountStats.map((item) => (
                  <Text key={item.accountId} style={styles.helper}>
                    @{item.username} • {item.postsToday}/{item.dailyLimit} today • ${item.profitTotal}
                  </Text>
                ))}

                <Text style={styles.itemTitle}>Recent Posts</Text>
                {dashboard.recentPosts.length === 0 ? (
                  <Text style={styles.helper}>No posts yet.</Text>
                ) : (
                  dashboard.recentPosts.map((post) => (
                    <Text key={post.id} style={styles.helper}>
                      @{post.account} posted {post.product} (${post.estimatedProfit})
                    </Text>
                  ))
                )}
              </View>
            ) : (
              <Text style={styles.helper}>No dashboard data yet.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  scroll: { padding: 16, gap: 12 },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 13, color: "#374151", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  helper: { color: "#6b7280", fontSize: 12 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  activeTab: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  tabText: { fontSize: 12, color: "#334155", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  rowGap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  button: { backgroundColor: "#0f172a", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonAlt: { backgroundColor: "#eef2ff", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, alignSelf: "flex-start" },
  buttonAltText: { color: "#3730a3", fontWeight: "700" },
  listItem: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, gap: 4 },
  itemTitle: { fontWeight: "700", color: "#111827" },
  smallButton: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  smallButtonText: { color: "#1d4ed8", fontWeight: "700", fontSize: 12 },
  smallButtonWarn: {
    alignSelf: "flex-start",
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  smallButtonWarnText: { color: "#b91c1c", fontWeight: "700", fontSize: 12 },
});
