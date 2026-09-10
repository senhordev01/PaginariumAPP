import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  TextInput,
  useWindowDimensions,
  Modal,
  FlatList,
  Platform,
  Alert,
} from "react-native";

import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePWAInstall } from "../hooks/usePWAInstall";

import Lua from "../assets/Lua_PixelArt.png";
import Sol from "../assets/Sol_PixelArt.png";
import Logout from "../assets/Logout.png";
import Opcoes_Clara from "../assets/Opcoes_Clara.png";
import Opcoes_Escura from "../assets/Opcoes_Escura.png";
import Fechar from "../assets/Fechar.png";
import Lupa from "../assets/Lupa.png";

// const BASE = "http://10.0.10.209:8080";
const BASE = "https://paginariumapi.onrender.com";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  credito: number;
  tipo: string;
}

interface Livro {
  id: number;
  nome: string;
  genero: string;
  valor: number;
  capa_url?: string;
  pdf_url?: string;
  inserir_valor: number;
}

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;

  Inicio: {
    usuario: Usuario;
    token: string;
  };

  LivrosAlugados: {
    usuario: Usuario;
    token: string;
  };
};

type NavigationProps =
  NativeStackNavigationProp<RootStackParamList>;

type InicioRouteProp =
  RouteProp<RootStackParamList, "Inicio">;

export default function Inicio() {
  const { width } = useWindowDimensions();

  const Mobile = width < 600;

  const navigation =
    useNavigation<NavigationProps>();

  const route =
    useRoute<InicioRouteProp>();

  const [usuario, setUsuario] =
    useState<Usuario | undefined>(
      route.params?.usuario
    );

  const [token, setToken] =
    useState<string | null>(
      route.params?.token ?? null
    );

  const [tema, setTema] =
    useState("#e9eaecde");

  const [menuVisible, setMenuVisible] =
    useState(false);

  const [livros, setLivros] =
    useState<Livro[]>([]);

  const [busca, setBusca] =
    useState("");

  const [termoPesquisado, setTermoPesquisado] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  const [livrosAlugadosIds, setLivrosAlugadosIds] =
    useState<Set<number>>(new Set());

  const [livroSelecionado, setLivroSelecionado] =
    useState<Livro | null>(null);

  const [inserir_valor, setInserirValor] =
    useState("");

  const isDark =
    tema === "black";

  const {
    isInstallable,
    install,
  } = usePWAInstall();

  // =====================================================
  // LOGOUT
  // =====================================================

  async function logout() {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("usuario");

    navigation.navigate("Login");
  }

  // =====================================================
  // SESSÃO EXPIRADA
  // =====================================================

  async function handleUnauthorized() {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("usuario");

    Alert.alert(
      "Sessão expirada",
      "Sua sessão expirou. Faça login novamente.",
      [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("Login"),
        },
      ]
    );
  }

  // =====================================================
  // CARREGAR ALUGUÉIS ATIVOS
  // =====================================================

  async function carregarAlugueisAtivos(
    tkn: string
  ) {
    try {
      console.log(
        "TOKEN USADO EM /alugueis:",
        tkn
      );

      const res =
        await fetch(
          `${BASE}/alugueis`,
          {
            method: "GET",
            cache: "no-store",

            headers: {
              Authorization:
                `Bearer ${tkn}`,
            },
          }
        );

      // -------------------------------------------------
      // TOKEN INVÁLIDO
      // -------------------------------------------------

      if (
        res.status === 401 ||
        res.status === 403
      ) {
        await handleUnauthorized();
        return;
      }

      // -------------------------------------------------
      // ERRO NA API
      // -------------------------------------------------

      if (!res.ok) {
        console.log(
          "Erro ao buscar aluguéis:",
          res.status
        );

        return;
      }

      // -------------------------------------------------
      // DADOS
      // -------------------------------------------------

      const data =
        await res.json();

      if (!Array.isArray(data)) {
        return;
      }

      // -------------------------------------------------
      // FILTRAR ALUGUÉIS ATIVOS
      // -------------------------------------------------

      const hoje =
        new Date();

      const idsAtivos =
        new Set<number>(
          data
            .filter(
              (a: any) =>
                new Date(
                  a.data_fim
                ) >= hoje
            )
            .map(
              (a: any) =>
                Number(
                  a.livro_id
                )
            )
        );

      setLivrosAlugadosIds(
        idsAtivos
      );

      console.log(
        "📚 Livros alugados:",
        idsAtivos
      );

    } catch (err) {
      console.log(
        "Erro alugueis:",
        err
      );
    }
  }

  // =====================================================
  // RECUPERAR SESSÃO
  // =====================================================

  useEffect(() => {
    async function recuperarSessao() {
      try {
        let tokenAtual =
          token;

        let usuarioAtual =
          usuario;

        // -------------------------------------------------
        // RECUPERAR DADOS DO DISPOSITIVO
        // -------------------------------------------------

        const tokenSalvo =
          await AsyncStorage.getItem(
            "token"
          );

        const usuarioSalvo =
          await AsyncStorage.getItem(
            "usuario"
          );

        // =================================================
        // 1. RECUPERAR TOKEN
        // =================================================

        if (!tokenAtual) {
          if (!tokenSalvo) {
            navigation.navigate(
              "Login"
            );

            return;
          }

          tokenAtual =
            tokenSalvo;

          setToken(
            tokenSalvo
          );
        }

        // =================================================
        // 2. RECUPERAR USUÁRIO
        // =================================================

        if (
          !usuarioAtual &&
          usuarioSalvo
        ) {
          try {
            usuarioAtual =
              JSON.parse(
                usuarioSalvo
              );

            setUsuario(
              usuarioAtual
            );

          } catch (erro) {
            console.log(
              "Erro ao ler usuário salvo:",
              erro
            );
          }
        }

        // =================================================
        // VERIFICAR SESSÃO
        // =================================================

        if (
          !tokenAtual ||
          !usuarioAtual?.id
        ) {
          navigation.navigate(
            "Login"
          );

          return;
        }

        console.log(
          "TOKEN:",
          tokenAtual
        );

        console.log(
          "ID DO USUÁRIO:",
          usuarioAtual.id
        );

        // =================================================
        // 3. BUSCAR USUÁRIO ATUALIZADO
        // =================================================

        const usuarioRes =
          await fetch(
            `${BASE}/usuarios/${usuarioAtual.id}`,
            {
              method: "GET",
              cache: "no-store",

              headers: {
                Authorization:
                  `Bearer ${tokenAtual}`,
              },
            }
          );

        // =================================================
        // TOKEN INVÁLIDO
        // =================================================

        if (
          usuarioRes.status === 401 ||
          usuarioRes.status === 403
        ) {
          await handleUnauthorized();

          return;
        }

        // =================================================
        // USUÁRIO ENCONTRADO
        // =================================================

        if (usuarioRes.ok) {
          const usuarioServidor =
            await usuarioRes.json();

          console.log(
            "USUÁRIO DO BANCO:",
            usuarioServidor
          );

          console.log(
            "CRÉDITO ATUAL:",
            usuarioServidor.credito
          );

          const usuarioAtualizado = {
            ...usuarioAtual,

            id: Number(
              usuarioServidor.id
            ),

            nome:
              usuarioServidor.nome,

            email:
              usuarioServidor.email,

            credito:
              Number(
                usuarioServidor.credito
              ),

            tipo:
              usuarioAtual.tipo ??
              "normal",
          };

          // Atualizar tela
          setUsuario(
            usuarioAtualizado
          );

          // Atualizar armazenamento
          await AsyncStorage.setItem(
            "usuario",
            JSON.stringify(
              usuarioAtualizado
            )
          );

          // Atualizar variável local
          usuarioAtual =
            usuarioAtualizado;

          console.log(
            "💰 CRÉDITO SINCRONIZADO:",
            usuarioAtualizado.credito
          );

        } else {
          console.log(
            "Erro ao buscar usuário:",
            usuarioRes.status
          );
        }

        // =================================================
        // 4. BUSCAR ALUGUÉIS
        // =================================================

        const res =
          await fetch(
            `${BASE}/alugueis`,
            {
              method: "GET",
              cache: "no-store",

              headers: {
                Authorization:
                  `Bearer ${tokenAtual}`,
              },
            }
          );

        // =================================================
        // TOKEN INVÁLIDO
        // =================================================

        if (
          res.status === 401 ||
          res.status === 403
        ) {
          await handleUnauthorized();

          return;
        }

        // =================================================
        // ALUGUÉIS ENCONTRADOS
        // =================================================

        if (res.ok) {
          const data =
            await res.json();

          if (
            Array.isArray(data)
          ) {
            const hoje =
              new Date();

            const idsAtivos =
              new Set<number>(
                data
                  .filter(
                    (a: any) =>
                      new Date(
                        a.data_fim
                      ) >= hoje
                  )
                  .map(
                    (a: any) =>
                      Number(
                        a.livro_id
                      )
                  )
              );

            setLivrosAlugadosIds(
              idsAtivos
            );
          }

        } else {
          console.log(
            "Erro ao buscar aluguéis:",
            res.status
          );
        }

      } catch (err) {
        console.log(
          "Erro ao recuperar sessão:",
          err
        );
      }
    }

    recuperarSessao();

  }, []);

  // =====================================================
  // CARREGAR LIVROS
  // =====================================================

  async function carregarLivros() {
    try {
      const res =
        await fetch(
          `${BASE}/livros`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!res.ok) {
        console.log(
          "Erro ao carregar livros:",
          res.status
        );

        return;
      }

      const data: Livro[] =
        await res.json();

      setLivros(
        data.map(
          (l) => ({
            ...l,
            valor:
              Number(
                l.valor
              ),
          })
        )
      );

    } catch (err) {
      console.log(
        "Erro ao carregar livros:",
        err
      );
    }
  }

  // =====================================================
  // CARREGAR LIVROS AO ABRIR A TELA
  // =====================================================

  useEffect(() => {
    carregarLivros();
  }, []);

  // =====================================================
  // CARREGAR ALUGUÉIS QUANDO TOKEN MUDAR
  // =====================================================

  useEffect(() => {
    if (token) {
      carregarAlugueisAtivos(
        token
      );
    }
  }, [token]);

  // =====================================================
  // ATUALIZAR AUTOMATICAMENTE AO VOLTAR PARA A TELA
  // =====================================================

  useFocusEffect(
    useCallback(() => {

      // -------------------------------------------------
      // Se não tiver sessão, não faz nada
      // -------------------------------------------------

      if (
        !token ||
        !usuario?.id
      ) {
        return;
      }

      // -------------------------------------------------
      // IMPORTANTE:
      // Criamos variáveis locais para o TypeScript
      // saber que não são null/undefined.
      // -------------------------------------------------

      const tokenAtual: string =
        token;

      const usuarioId: number =
        Number(
          usuario.id
        );

      async function atualizarAoVoltar() {
        try {
          console.log(
            "🔄 Atualizando tela ao voltar..."
          );

          // =================================================
          // 1. ATUALIZAR USUÁRIO E CRÉDITO
          // =================================================

          const usuarioRes =
            await fetch(
              `${BASE}/usuarios/${usuarioId}`,
              {
                method: "GET",
                cache: "no-store",

                headers: {
                  Authorization:
                    `Bearer ${tokenAtual}`,
                },
              }
            );

          // -------------------------------------------------
          // TOKEN EXPIRADO
          // -------------------------------------------------

          if (
            usuarioRes.status === 401 ||
            usuarioRes.status === 403
          ) {
            await handleUnauthorized();

            return;
          }

          // -------------------------------------------------
          // USUÁRIO ENCONTRADO
          // -------------------------------------------------

          if (usuarioRes.ok) {
            const usuarioServidor =
              await usuarioRes.json();

            console.log(
              "👤 Usuário atualizado:",
              usuarioServidor
            );

            console.log(
              "💰 Crédito vindo do banco:",
              usuarioServidor.credito
            );

            // -------------------------------------------------
            // Atualizar usando o estado anterior
            // -------------------------------------------------

            setUsuario(
              (usuarioAnterior) => {

                if (!usuarioAnterior) {
                  return usuarioAnterior;
                }

                const usuarioAtualizado =
                  {
                    ...usuarioAnterior,

                    id: Number(
                      usuarioServidor.id
                    ),

                    nome:
                      usuarioServidor.nome,

                    email:
                      usuarioServidor.email,

                    credito:
                      Number(
                        usuarioServidor.credito
                      ),

                    tipo:
                      usuarioAnterior.tipo ??
                      "normal",
                  };

                // -------------------------------------------------
                // Atualizar AsyncStorage
                // -------------------------------------------------

                AsyncStorage.setItem(
                  "usuario",
                  JSON.stringify(
                    usuarioAtualizado
                  )
                );

                console.log(
                  "💰 Crédito atualizado:",
                  usuarioAtualizado.credito
                );

                return usuarioAtualizado;
              }
            );

          } else {
            console.log(
              "Erro ao atualizar usuário:",
              usuarioRes.status
            );
          }

          // =================================================
          // 2. ATUALIZAR LIVROS ALUGADOS
          // =================================================

          await carregarAlugueisAtivos(
            tokenAtual
          );

          // =================================================
          // 3. ATUALIZAR LISTA DE LIVROS
          // =================================================

          await carregarLivros();

          console.log(
            "✅ Tela atualizada!"
          );

        } catch (erro) {
          console.log(
            "❌ Erro ao atualizar tela ao voltar:",
            erro
          );
        }
      }

      atualizarAoVoltar();

    }, [token, usuario?.id])
  );

  // =====================================================
  // FILTRO DE LIVROS
  // =====================================================

  const livrosFiltrados =
    livros.filter(
      (l) => {

        if (
          !termoPesquisado.trim()
        ) {
          return true;
        }

        const termo =
          termoPesquisado.toLowerCase();

        return (
          l.nome
            .toLowerCase()
            .includes(termo) ||

          l.genero
            .toLowerCase()
            .includes(termo)
        );
      }
    );

  // =====================================================
  // PESQUISAR
  // =====================================================

  function pesquisar() {
    setTermoPesquisado(
      busca
    );
  }

  // =====================================================
  // CÁLCULO DO ALUGUEL
  // =====================================================

  const meses =
    parseInt(
      inserir_valor,
      10
    );

  const totalAluguel =
    !isNaN(meses) &&
    meses > 0 &&
    livroSelecionado

      ? meses *
        Number(
          livroSelecionado.valor
        )

      : 0;

  const creditoAtual =
    Number(
      usuario?.credito ?? 0
    );

  const saldoInsuficiente =
    totalAluguel >
    creditoAtual;

  // =====================================================
  // CONFIRMAR ALUGUEL
  // =====================================================

  async function confirmarAluguel() {

    if (
      !livroSelecionado ||
      isNaN(meses) ||
      meses <= 0 ||
      saldoInsuficiente
    ) {
      return;
    }

    if (!token) {
      await handleUnauthorized();
      return;
    }

    setCarregando(true);

    try {

      const res =
        await fetch(
          `${BASE}/alugueis`,
          {
            method: "POST",
            cache: "no-store",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                livro_id:
                  livroSelecionado.id,

                meses,
              }),
          }
        );

      // =================================================
      // TOKEN INVÁLIDO
      // =================================================

      if (
        res.status === 401 ||
        res.status === 403
      ) {
        setLivroSelecionado(
          null
        );

        await handleUnauthorized();

        return;
      }

      // =================================================
      // RESPOSTA
      // =================================================

      const data =
        await res.json();

      // =================================================
      // ERRO
      // =================================================

      if (!res.ok) {
        Alert.alert(
          "Erro",
          typeof data === "string"
            ? data
            : "Erro ao alugar"
        );

        return;
      }

      // =================================================
      // ATUALIZAR CRÉDITO
      // =================================================

      setUsuario(
        (prev) => {

          const atualizado =
            prev
              ? {
                  ...prev,

                  credito:
                    Number(
                      data.novo_credito
                    ),
                }
              : prev;

          if (atualizado) {
            AsyncStorage.setItem(
              "usuario",
              JSON.stringify(
                atualizado
              )
            );
          }

          return atualizado;
        }
      );

      console.log(
        "💰 Novo crédito:",
        data.novo_credito
      );

      // =================================================
      // ATUALIZAR ALUGUÉIS
      // =================================================

      await carregarAlugueisAtivos(
        token
      );

      // =================================================
      // LIMPAR MODAL
      // =================================================

      setLivroSelecionado(
        null
      );

      setInserirValor(
        ""
      );

      // =================================================
      // MENSAGEM
      // =================================================

      Alert.alert(
        "Sucesso!",
        `Livro alugado por ${meses} ${
          meses === 1
            ? "mês"
            : "meses"
        }!`
      );

    } catch (err) {

      console.log(
        "Erro ao realizar aluguel:",
        err
      );

      Alert.alert(
        "Erro",
        "Não foi possível conectar ao servidor"
      );

    } finally {

      setCarregando(
        false
      );
    }
  }

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
      }}

      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }

      keyboardVerticalOffset={
        Platform.OS === "ios"
          ? 0
          : 20
      }
    >

      <View
        style={{
          flex: 1,

          backgroundColor:
            isDark
              ? "#1F1F1F"
              : tema,
        }}
      >

        {/* =================================================
            NAVBAR
        ================================================= */}

        <SafeAreaView
          style={
            styles.navbar
          }
        >

          <TouchableOpacity
            onPress={
              logout
            }
          >
            <Image
              source={
                Logout
              }

              style={
                styles.icon
              }
            />
          </TouchableOpacity>

          <Text
            style={{
              color:
                "white",

              fontSize:
                Mobile
                  ? 16
                  : 20,

              fontWeight:
                "bold",
            }}
          >
            Olá,{" "}
            {usuario?.nome ??
              "Usuário"}
          </Text>

          <TouchableOpacity
            onPress={() =>
              setTema(
                isDark
                  ? "#e9eaecde"
                  : "black"
              )
            }
          >
            <Image
              source={
                isDark
                  ? Sol
                  : Lua
              }

              style={
                styles.icon
              }
            />
          </TouchableOpacity>

        </SafeAreaView>

        {/* =================================================
            BARRA DE OPÇÕES
        ================================================= */}

        <View
          style={{
            backgroundColor:
              isDark
                ? "#333"
                : "white",

            width:
              "100%",

            justifyContent:
              "center",

            height: 80,
          }}
        >

          <Text
            style={{
              color:
                isDark
                  ? "white"
                  : "black",

              fontSize: 20,

              position:
                "absolute",

              marginBottom: 4,

              right: 10,
            }}
          >
            Créditos: R${" "}
            {Number(
              usuario?.credito ??
                0
            ).toFixed(2)}
          </Text>

          <TouchableOpacity
            style={{
              padding: 10,

              width: 60,

              left: 15,
            }}

            onPress={() =>
              setMenuVisible(
                true
              )
            }
          >

            <Image
              source={
                isDark
                  ? Opcoes_Clara
                  : Opcoes_Escura
              }

              style={
                styles.icon
              }
            />

          </TouchableOpacity>

        </View>

        {/* =================================================
            LISTA DE LIVROS
        ================================================= */}

        <FlatList
          data={
            livrosFiltrados
          }

          keyExtractor={
            (item) =>
              item.id.toString()
          }

          contentContainerStyle={{
            padding: 20,

            alignItems:
              "center",
          }}

          style={{
            backgroundColor:
              isDark
                ? "#1F1F1F"
                : "transparent",
          }}

          keyboardShouldPersistTaps="handled"

          ListEmptyComponent={
            <View
              style={{
                marginTop: 60,

                alignItems:
                  "center",
              }}
            >

              <Text
                style={{
                  color:
                    isDark
                      ? "#ccc"
                      : "#666",

                  fontSize: 16,
                }}
              >
                Nenhum livro
                encontrado para
                "{termoPesquisado}"
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setBusca(
                    ""
                  );

                  setTermoPesquisado(
                    ""
                  );
                }}

                style={{
                  marginTop: 16,

                  padding: 10,

                  backgroundColor:
                    "#fc5603",

                  borderRadius: 8,
                }}
              >

                <Text
                  style={{
                    color:
                      "white",

                    fontWeight:
                      "bold",
                  }}
                >
                  Limpar pesquisa
                </Text>

              </TouchableOpacity>

            </View>
          }

          ListHeaderComponent={
            <View
              style={{
                alignItems:
                  "center",

                marginBottom:
                  20,

                marginTop:
                  10,
              }}
            >

              <View
                style={{
                  flexDirection:
                    "row",
                }}
              >

                <TextInput
                  placeholder="Digite o nome do livro ou Gênero..."

                  underlineColorAndroid="transparent"

                  value={
                    busca
                  }

                  onChangeText={
                    setBusca
                  }

                  returnKeyType="search"

                  onSubmitEditing={
                    pesquisar
                  }

                  style={{
                    width:
                      Mobile
                        ? 280
                        : 550,

                    height: 50,

                    textAlign:
                      "center",

                    borderColor:
                      isDark
                        ? "white"
                        : "black",

                    borderWidth:
                      2,

                    backgroundColor:
                      "white",

                    borderTopLeftRadius:
                      20,

                    borderBottomLeftRadius:
                      20,

                    borderTopRightRadius:
                      0,

                    borderBottomRightRadius:
                      0,
                  }}
                />

                <TouchableOpacity
                  onPress={
                    pesquisar
                  }

                  style={{
                    width: 50,

                    height: 50,

                    backgroundColor:
                      "white",

                    justifyContent:
                      "center",

                    alignItems:
                      "center",

                    borderTopWidth:
                      2,

                    borderRightWidth:
                      2,

                    borderBottomWidth:
                      2,

                    borderTopColor:
                      isDark
                        ? "white"
                        : "black",

                    borderRightColor:
                      isDark
                        ? "white"
                        : "black",

                    borderBottomColor:
                      isDark
                        ? "white"
                        : "black",

                    borderTopRightRadius:
                      20,

                    borderBottomRightRadius:
                      20,

                    borderLeftWidth:
                      0,

                    right: 5,
                  }}
                >

                  <Image
                    source={
                      Lupa
                    }

                    style={{
                      width: 30,
                      height: 30,
                    }}
                  />

                </TouchableOpacity>

              </View>

            </View>
          }

          renderItem={({
            item,
          }) => {

            const jaAlugado =
              livrosAlugadosIds.has(
                item.id
              );

            return (

              <View
                style={{
                  padding: 15,

                  margin: 20,

                  width:
                    Mobile
                      ? "95%"
                      : 650,

                  height:
                    Mobile
                      ? "95%"
                      : 840,

                  backgroundColor:
                    isDark
                      ? "#333"
                      : "white",

                  borderRadius:
                    20,

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  alignSelf:
                    "center",
                }}
              >

                <Image
                  source={{
                    uri:
                      item.capa_url,
                  }}

                  style={[
                    styles.capa,

                    {
                      width:
                        Mobile
                          ? width *
                            0.8
                          : 600,

                      height:
                        Mobile
                          ? 600 *
                            0.8
                          : 600,
                    },
                  ]}
                />

                <Text
                  style={{
                    fontSize:
                      Mobile
                        ? 16
                        : 18,

                    fontWeight:
                      "bold",

                    color:
                      isDark
                        ? "white"
                        : "black",
                  }}
                >
                  {item.nome}
                </Text>

                <Text
                  style={{
                    color:
                      isDark
                        ? "#ccc"
                        : "#333",
                  }}
                >
                  {item.genero}
                </Text>

                <Text
                  style={{
                    color:
                      isDark
                        ? "#ccc"
                        : "#333",
                  }}
                >
                  Valor: R${" "}
                  {Number(
                    item.valor
                  ).toFixed(2)}{" "}
                  / Mês
                </Text>

                <TouchableOpacity
                  style={{
                    padding: 10,

                    width: "90%",

                    borderRadius: 20,

                    margin: 10,

                    backgroundColor:
                      jaAlugado
                        ? "#aaa"
                        : "#fc5603",
                  }}

                  disabled={
                    jaAlugado
                  }

                  onPress={() => {
                    setInserirValor(
                      ""
                    );

                    setLivroSelecionado(
                      item
                    );
                  }}
                >

                  <Text
                    style={{
                      color:
                        "white",

                      fontWeight:
                        "bold",

                      fontSize: 20,

                      textAlign:
                        "center",
                    }}
                  >
                    {jaAlugado
                      ? "Já Alugado"
                      : "Alugar"}
                  </Text>

                </TouchableOpacity>

              </View>
            );
          }}
        />

        {/* =================================================
            MODAL DE ALUGUEL
        ================================================= */}

        <Modal
          visible={
            livroSelecionado !==
            null
          }

          transparent

          animationType="slide"

          onRequestClose={() =>
            setLivroSelecionado(
              null
            )
          }
        >

          <View
            style={
              styles.modal
            }
          >

            <View
              style={
                styles.modalBox
              }
            >

              <Text
                style={{
                  fontWeight:
                    "bold",

                  fontSize: 15,

                  marginBottom:
                    10,

                  textAlign:
                    "center",

                  padding: 20,
                }}
              >
                {
                  livroSelecionado?.nome
                }
              </Text>

              <TextInput
                placeholder="Por quantos meses deseja alugar?"

                value={
                  inserir_valor
                }

                onChangeText={(
                  text
                ) => {

                  const apenasNumeros =
                    text.replace(
                      /[^0-9]/g,
                      ""
                    );

                  const semZeroEsquerda =
                    apenasNumeros.replace(
                      /^0+/,
                      ""
                    );

                  setInserirValor(
                    semZeroEsquerda.slice(
                      0,
                      4
                    )
                  );
                }}

                keyboardType="numeric"

                maxLength={4}

                style={{
                  borderWidth:
                    1,

                  borderColor:
                    "#ccc",

                  borderRadius:
                    8,

                  padding:
                    10,

                  marginBottom:
                    16,

                  textAlign:
                    "center",
                }}
              />

              {/* =================================================
                  TOTAL
              ================================================= */}

              {inserir_valor !==
                "" &&
                livroSelecionado &&
                !isNaN(meses) &&
                meses > 0 && (

                  <Text
                    style={{
                      textAlign:
                        "center",

                      marginBottom:
                        10,
                    }}
                  >

                    {meses}{" "}
                    {meses === 1
                      ? "mês"
                      : "meses"}{" "}

                    × R${" "}
                    {Number(
                      livroSelecionado.valor
                    ).toFixed(2)}{" "}

                    ={" "}

                    <Text
                      style={{
                        fontWeight:
                          "bold",

                        color:
                          saldoInsuficiente
                            ? "#cc0000"
                            : "#fc5603",
                      }}
                    >
                      R${" "}
                      {totalAluguel.toFixed(
                        2
                      )}
                    </Text>

                  </Text>
                )}

              {/* =================================================
                  SALDO INSUFICIENTE
              ================================================= */}

              {saldoInsuficiente &&
                inserir_valor !==
                  "" &&
                meses > 0 && (

                  <Text
                    style={{
                      textAlign:
                        "center",

                      color:
                        "#cc0000",

                      fontWeight:
                        "bold",

                      marginBottom:
                        16,

                      fontSize:
                        13,
                    }}
                  >
                    Saldo insuficiente.
                    Você possui R${" "}
                    {creditoAtual.toFixed(
                      2
                    )}{" "}
                    de crédito.
                  </Text>
                )}

              {/* =================================================
                  SALDO APÓS ALUGUEL
              ================================================= */}

              {!saldoInsuficiente &&
                inserir_valor !==
                  "" &&
                meses > 0 && (

                  <Text
                    style={{
                      textAlign:
                        "center",

                      color:
                        "#2e7d32",

                      fontSize:
                        13,

                      marginBottom:
                        16,
                    }}
                  >
                    Saldo após aluguel:
                    R${" "}
                    {(
                      creditoAtual -
                      totalAluguel
                    ).toFixed(
                      2
                    )}
                  </Text>
                )}

              {/* =================================================
                  CONFIRMAR
              ================================================= */}

              <TouchableOpacity
                style={[
                  styles.btnSalvar,

                  (
                    saldoInsuficiente ||
                    inserir_valor ===
                      "" ||
                    meses <= 0 ||
                    carregando
                  )
                    ? {
                        backgroundColor:
                          "#aaa",
                      }
                    : {},
                ]}

                disabled={
                  saldoInsuficiente ||
                  inserir_valor ===
                    "" ||
                  isNaN(meses) ||
                  meses <= 0 ||
                  carregando
                }

                onPress={
                  confirmarAluguel
                }
              >

                <Text
                  style={{
                    color:
                      "white",

                    fontWeight:
                      "bold",

                    textAlign:
                      "center",
                  }}
                >
                  {carregando
                    ? "Processando..."
                    : "Confirmar Aluguel"}
                </Text>

              </TouchableOpacity>

              {/* =================================================
                  FECHAR
              ================================================= */}

              <TouchableOpacity
                onPress={() =>
                  setLivroSelecionado(
                    null
                  )
                }

                style={{
                  position:
                    "absolute",

                  top: 15,

                  right: 10,
                }}
              >

                <Image
                  source={
                    Fechar
                  }

                  style={{
                    width: 20,
                    height: 20,
                  }}
                />

              </TouchableOpacity>

            </View>

          </View>

        </Modal>

        {/* =================================================
            MENU MODAL
        ================================================= */}

        <Modal
          visible={
            menuVisible
          }

          transparent

          animationType="fade"

          onRequestClose={() =>
            setMenuVisible(
              false
            )
          }
        >

          <View
            style={{
              flex: 1,

              backgroundColor:
                "rgba(0,0,0,0.5)",
            }}
          >

            <View
              style={{
                backgroundColor:
                  "white",

                width:
                  Mobile
                    ? "100%"
                    : 450,

                height:
                  "100%",

                padding: 20,

                paddingTop: 60,

                alignItems:
                  "center",

                top: 100,
              }}
            >

              <Text
                style={{
                  fontSize:
                    18,

                  fontWeight:
                    "bold",

                  marginBottom:
                    40,

                  color:
                    isDark
                      ? "white"
                      : "black",
                }}
              >
                Menu
              </Text>

              {/* =================================================
                  CONFIGURAÇÕES
              ================================================= */}

              <TouchableOpacity
                style={
                  styles.menuBtn
                }
              >

                <Text
                  style={{
                    color:
                      "white",

                    textAlign:
                      "center",
                  }}
                >
                  Configurações
                </Text>

              </TouchableOpacity>

              {/* =================================================
                  MEUS LIVROS
              ================================================= */}

              <TouchableOpacity
                style={
                  styles.menuBtn
                }

                onPress={() => {

                  if (
                    !usuario ||
                    !token
                  ) {
                    return;
                  }

                  setMenuVisible(
                    false
                  );

                  navigation.navigate(
                    "LivrosAlugados",
                    {
                      usuario:
                        usuario,

                      token:
                        token,
                    }
                  );

                }}
              >

                <Text
                  style={{
                    color:
                      "white",

                    textAlign:
                      "center",
                  }}
                >
                  Meus Livros
                </Text>

              </TouchableOpacity>

              {/* =================================================
                  INSTALAR APP
              ================================================= */}

              {isInstallable && (

                <TouchableOpacity
                  style={
                    styles.menuBtn
                  }

                  onPress={() => {

                    setMenuVisible(
                      false
                    );

                    install();

                  }}
                >

                  <Text
                    style={{
                      color:
                        "white",

                      textAlign:
                        "center",
                    }}
                  >
                    📲 Instalar App
                  </Text>

                </TouchableOpacity>

              )}

              {/* =================================================
                  FECHAR MENU
              ================================================= */}

              <TouchableOpacity
                onPress={() =>
                  setMenuVisible(
                    false
                  )
                }

                style={{
                  padding: 10,

                  position:
                    "absolute",

                  top: 10,

                  right: 10,
                }}
              >

                <Image
                  source={
                    Fechar
                  }

                  style={{
                    width: 30,
                    height: 30,
                  }}
                />

              </TouchableOpacity>

            </View>

          </View>

        </Modal>

      </View>

    </KeyboardAvoidingView>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({

  navbar: {
    width: "100%",

    height: 100,

    backgroundColor:
      "#ad000e",

    flexDirection:
      "row",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    paddingHorizontal:
      20,
  },

  icon: {
    width: 40,

    height: 40,

    resizeMode:
      "contain",
  },

  modal: {
    flex: 1,

    backgroundColor:
      "#000000aa",

    justifyContent:
      "center",

    alignItems:
      "center",
  },

  modalBox: {
    width: "80%",

    backgroundColor:
      "white",

    padding: 20,

    borderRadius:
      10,
  },

  btnSalvar: {
    backgroundColor:
      "#fc5603",

    padding: 12,

    alignItems:
      "center",

    borderRadius:
      8,

    marginTop: 8,
  },

  capa: {
    height: 300,

    borderRadius:
      8,

    marginBottom:
      10,

    resizeMode:
      "cover",
  },

  menuBtn: {
    width: "100%",

    padding: 12,

    backgroundColor:
      "#ad000e",

    borderRadius:
      8,

    marginBottom:
      16,
  },

});