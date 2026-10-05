import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState('shop');
  const [products, setProducts] = useState([]);
  const [cartRows, setCartRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // ---------- session ----------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---------- data ----------
  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) Alert.alert('Products error', error.message);
    else setProducts(data ?? []);
  }, []);

  const loadCart = useCallback(async () => {
    const { data, error } = await supabase.from('cart_items').select('*');
    if (error) Alert.alert('Cart error', error.message);
    else setCartRows(data ?? []);
  }, []);

  useEffect(() => {
    if (session) {
      loadProducts();
      loadCart();
    } else {
      setCartRows([]);
    }
  }, [session, loadProducts, loadCart]);

  // reload cart when opening the Cart tab, and keep it fresh every 4 seconds
  useEffect(() => {
    if (!session || tab !== 'cart') return;
    loadCart();
    const id = setInterval(loadCart, 4000);
    return () => clearInterval(id);
  }, [tab, session, loadCart]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadProducts(), loadCart()]);
    setRefreshing(false);
  }

  // ---------- auth actions ----------
  async function signIn() {
    if (!email || !password) return Alert.alert('Enter email and password');
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) Alert.alert('Sign in failed', error.message);
  }

  async function signUp() {
    if (!email || !password) return Alert.alert('Enter email and password');
    setAuthBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthBusy(false);
      return Alert.alert('Sign up failed', error.message);
    }
    if (!data.session) {
      const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
      if (e2) Alert.alert('Account created', 'Now press Sign in.\n' + e2.message);
    }
    setAuthBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setTab('shop');
  }

  // ---------- cart actions ----------
  async function addToCart(p) {
    const pid = String(p.id);
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('product_id', pid)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({ product_id: pid, quantity: 1 });
    }
    await loadCart();
    Alert.alert('Added', p.name + ' added to cart');
  }

  async function changeQty(row, delta) {
    const q = row.quantity + delta;
    if (q <= 0) await supabase.from('cart_items').delete().eq('id', row.id);
    else await supabase.from('cart_items').update({ quantity: q }).eq('id', row.id);
    loadCart();
  }

  async function removeItem(row) {
    await supabase.from('cart_items').delete().eq('id', row.id);
    loadCart();
  }

  // ---------- derived ----------
  const cartCount = cartRows.reduce((s, r) => s + r.quantity, 0);
  const lines = cartRows
    .map((r) => ({ row: r, product: products.find((p) => String(p.id) === r.product_id) }))
    .filter((l) => l.product);
  const total = lines.reduce((s, l) => s + Number(l.product.price) * l.row.quantity, 0);

  // ---------- screens ----------
  if (booting) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.screen, styles.center]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loginCard}>
          <Text style={styles.logo}>
            HNG-SHOP<Text style={{ color: '#0a66ff' }}>.</Text>
          </Text>
          <Text style={styles.loginTitle}>Sign in</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.btnBlack} onPress={signIn} disabled={authBusy}>
            <Text style={styles.btnBlackText}>{authBusy ? 'Please wait...' : 'Sign in'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={signUp} disabled={authBusy}>
            <Text style={styles.btnOutlineText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          HNG-SHOP<Text style={{ color: '#0a66ff' }}>.</Text>
        </Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* shop tab */}
      {tab === 'shop' && (
        <FlatList
          data={products}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Trending Products</Text>}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              {!!p.image && <Image source={{ uri: p.image }} style={styles.cardImg} />}
              <View style={{ padding: 16 }}>
                <Text style={styles.cardName}>{p.name}</Text>
                <Text style={styles.cardDesc}>{p.description}</Text>
                <View style={styles.row}>
                  <Text style={styles.price}>₹{p.price}</Text>
                  <TouchableOpacity style={styles.btnBlue} onPress={() => addToCart(p)}>
                    <Text style={styles.btnBlueText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* cart tab */}
      {tab === 'cart' && (
        <FlatList
          data={lines}
          keyExtractor={(l) => l.row.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Your Cart</Text>}
          ListEmptyComponent={<Text style={styles.empty}>Cart is empty</Text>}
          ListFooterComponent={
            lines.length > 0 ? <Text style={styles.total}>Total: ₹{total}</Text> : null
          }
          renderItem={({ item: { row, product } }) => (
            <View style={styles.cartRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{product.name}</Text>
                <Text style={styles.cardDesc}>₹{product.price}</Text>
              </View>
              <View style={styles.qtyBox}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(row, -1)}>
                  <Text style={styles.qtyText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{row.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(row, 1)}>
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeItem(row)}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* bottom tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('shop')}>
          <Text style={[styles.tabText, tab === 'shop' && styles.tabActive]}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('cart')}>
          <Text style={[styles.tabText, tab === 'cart' && styles.tabActive]}>
            Cart ({cartCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f3ee', paddingTop: 44 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: { fontSize: 26, fontWeight: '900', color: '#000' },
  logout: { fontWeight: '700', textDecorationLine: 'underline', color: '#000' },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  cardImg: { width: '100%', height: 220, backgroundColor: '#f0f0f0' },
  cardName: { fontSize: 17, fontWeight: '900', color: '#000' },
  cardDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  price: { fontSize: 20, fontWeight: '900', color: '#000' },
  btnBlue: {
    backgroundColor: '#0a66ff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  btnBlueText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    elevation: 3,
  },
  loginTitle: { fontSize: 22, fontWeight: '900', color: '#000', marginVertical: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  btnBlack: {
    backgroundColor: '#000',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnBlackText: { color: '#fff', fontWeight: '800' },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnOutlineText: { color: '#000', fontWeight: '800' },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  qtyBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  qtyBtn: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  qtyText: { fontSize: 18, color: '#000' },
  qtyNum: { marginHorizontal: 10, fontWeight: '800', color: '#000' },
  remove: { color: '#d00', fontSize: 12 },
  total: { fontSize: 20, fontWeight: '900', color: '#000', marginTop: 10 },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 56,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  tabText: { fontWeight: '700', color: '#888', fontSize: 16 },
  tabActive: { color: '#0a66ff' },
});