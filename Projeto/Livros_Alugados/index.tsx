import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// const BASE = "http://10.0.10.209:8080";
const BASE = "https://paginariumapi-production.up.railway.app";

interface Aluguel {
  id: number;
  livro_id: number;
  nome: string;
  capa_url: string;
  pdf_url: string;
  meses: number;
  valor_total: string;
  data_inicio: string;
  data_fim: string;
  criado_em: string;
  segundos_restantes: number;
}

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Inicio: {
    usuario: { id: number; nome: string; email: string; credito: number; tipo: string };
    token: string;
  };
  Inicio_Adm: undefined;
  LivrosAlugados: {
    usuario: { id: number; nome: string; email: string; credito: number; tipo: string };
    token: string;
  };
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "LivrosAlugados">;

export default function LivrosAlugados() {
  const { width } = useWindowDimensions();
  const Mobile = width < 600;
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps>();
  const { usuario, token } = route.params;

  const [alugueis, setAlugueis] = useState<Aluguel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [contagensLocais, setContagensLocais] = useState<Record<number, number>>({});
  const [processando, setProcessando] = useState<number | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch(`${BASE}/alugueis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Aluguel[] = await res.json();
      setAlugueis(data);

      const iniciais: Record<number, number> = {};
      data.forEach((a) => {
        iniciais[a.id] = Math.max(0, Number(a.segundos_restantes));
      });
      setContagensLocais(iniciais);
    } catch (err) {
      console.log(err);
    } finally {
      setCarregando(false);
    }
  }

  // ✅ Recarrega sempre que a tela receber foco (ex: após alugar)
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  useEffect(() => {
    const intervalo = setInterval(() => {
      setContagensLocais((prev) => {
        const atualizado: Record<number, number> = {};
        for (const id in prev) {
          atualizado[id] = Math.max(0, prev[id] - 1);
        }
        return atualizado;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  function formatarData(dataStr: string) {
    const d = new Date(dataStr);
    return d.toLocaleDateString("pt-BR");
  }

  function estaAtivo(dataFim: string) {
    return new Date(dataFim) >= new Date();
  }

  function formatarContagem(segundos: number): string {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, "0")}`;
  }

  async function executarReembolso(aluguel: Aluguel) {
    console.log("EXECUTANDO REEMBOLSO ID:", aluguel.id);
    setProcessando(aluguel.id);
    try {
      const res = await fetch(`${BASE}/alugueis/${aluguel.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("STATUS REEMBOLSO:", res.status);
      console.log("RESPOSTA REEMBOLSO:", JSON.stringify(data));

      if (!res.ok) {
        Alert.alert("Erro", typeof data === "string" ? data : "Não foi possível reembolsar");
        return;
      }

      setAlugueis((prev) => prev.filter((a) => a.id !== aluguel.id));
      setContagensLocais((prev) => {
        const copia = { ...prev };
        delete copia[aluguel.id];
        return copia;
      });

      Alert.alert(
        "Reembolso realizado!",
        `R$ ${Number(aluguel.valor_total).toFixed(2)} devolvidos ao seu saldo.`
      );
    } catch (err) {
      console.log("ERRO REEMBOLSO:", err);
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    } finally {
      setProcessando(null);
    }
  }

  function abrirPdf(url: string) {
    Linking.openURL(url);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <SafeAreaView style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Text style={{ color: "white", fontSize: 24 }}>{"←"}</Text>
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: Mobile ? 16 : 20, fontWeight: "bold" }}>
          Meus Livros
        </Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {carregando ? (
        <ActivityIndicator size="large" color="#ad000e" style={{ marginTop: 40 }} />
      ) : alugueis.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#666", fontSize: 16 }}>
            Você ainda não alugou nenhum livro.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alugueis}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, alignItems: "center" }}
          renderItem={({ item }) => {
            const ativo = estaAtivo(item.data_fim);
            const segundosRestantes = contagensLocais[item.id] ?? 0;
            const podeReembolsar = segundosRestantes > 0;
            const estaProcessando = processando === item.id;

            return (
              <View style={[styles.card, { width: Mobile ? "100%" : 600 }]}>
                <Image source={{ uri: item.capa_url }} style={styles.capa} />

                <View style={{ flex: 1, paddingLeft: 16, justifyContent: "space-between" }}>
                  <Text style={styles.titulo} numberOfLines={2}>
                    {item.nome}
                  </Text>

                  <Text style={styles.info}>
                    {item.meses} {item.meses === 1 ? "mês" : "meses"} alugado
                  </Text>

                  <Text style={styles.info}>
                    Valor pago: R$ {Number(item.valor_total).toFixed(2)}
                  </Text>

                  <Text style={styles.info}>
                    Início: {formatarData(item.data_inicio)}
                  </Text>

                  <Text style={[styles.info, { color: ativo ? "#ad000e" : "#999", fontWeight: "bold" }]}>
                    {ativo
                      ? `Válido até: ${formatarData(item.data_fim)}`
                      : `Expirado em: ${formatarData(item.data_fim)}`}
                  </Text>

                  <View style={{
                    alignSelf: "flex-start",
                    backgroundColor: ativo ? "#e6f4ea" : "#f2f2f2",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    marginBottom: 8,
                  }}>
                    <Text style={{ fontSize: 12, color: ativo ? "#2e7d32" : "#999", fontWeight: "bold" }}>
                      {ativo ? "● Ativo" : "● Expirado"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.btnPdf, !ativo && { backgroundColor: "#ccc" }]}
                    onPress={() => abrirPdf(item.pdf_url)}
                    disabled={!ativo}
                  >
                    <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                        Abrir PDF
                    </Text>
                  </TouchableOpacity>

                  {podeReembolsar ? (
                    <TouchableOpacity
                      style={[styles.btnReembolso, estaProcessando && { backgroundColor: "#aaa" }]}
                      disabled={estaProcessando}
                      onPress={() => {
                        console.log("CLICOU REEMBOLSO ID:", item.id);
                        executarReembolso(item);
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "bold", textAlign: "center", fontSize: 13 }}>
                        {estaProcessando
                          ? "Processando..."
                          : `Reembolsar (${formatarContagem(segundosRestantes)})`}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.btnReembolsoExpirado}>
                      <Text style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
                        Prazo de reembolso encerrado
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    width: "100%",
    height: 100,
    backgroundColor: "#ad000e",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  capa: {
    width: 100,
    height: 150,
    borderRadius: 8,
    resizeMode: "cover",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  info: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
  },
  btnPdf: {
    marginTop: 10,
    backgroundColor: "#fc5603",
    padding: 10,
    borderRadius: 8,
  },
  btnReembolso: {
    marginTop: 8,
    backgroundColor: "#1565c0",
    padding: 10,
    borderRadius: 8,
  },
  btnReembolsoExpirado: {
    marginTop: 8,
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});