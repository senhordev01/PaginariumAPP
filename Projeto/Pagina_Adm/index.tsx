import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  TextInput,
  useWindowDimensions,
} from "react-native";

import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import Lua from "../assets/Lua_PixelArt.png";
import Sol from "../assets/Sol_PixelArt.png";
import Logout from "../assets/Logout.png";

const API = "https://paginariumapi.onrender.com";

interface Usuario {
  nome: string;
}

interface Livro {
  id: number;
  nome: string;
  genero: string;
  capa_url?: string;
  pdf_url?: string;
  valor: number;
}

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Inicio: {
    usuario: Usuario;
  };
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
type InicioRouteProp = RouteProp<RootStackParamList, "Inicio">;

export default function Inicio_Adm() {
  const { width } = useWindowDimensions();

  const Mobile = width < 600;
  const colunas = 1;

  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<InicioRouteProp>();

  const [usuario, setUsuario] = useState<Usuario | null>(
    route.params?.usuario ?? null
  );

  const [tema, setTema] = useState("#e9eaecde");
  const [modal, setModal] = useState(false);

  const [livros, setLivros] = useState<Livro[]>([]);

  const [nome, setNome] = useState("");
  const [genero, setGenero] = useState("");
  const [valor, setValor] = useState("");

  const [capa, setCapa] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);

  const [editId, setEditId] = useState<number | null>(null);

  const isDark = tema === "black";

  // =========================================================
  // RECUPERAR USUÁRIO APÓS F5
  // =========================================================

  useEffect(() => {
    async function recuperarUsuario() {
      try {
        const salvo = await AsyncStorage.getItem("usuario");

        if (salvo) {
          const usuarioSalvo = JSON.parse(salvo);

          console.log("USUÁRIO RECUPERADO:", usuarioSalvo);

          setUsuario(usuarioSalvo);
        }
      } catch (erro) {
        console.log("ERRO AO RECUPERAR USUÁRIO:", erro);
      }
    }

    recuperarUsuario();
  }, []);

  // =========================================================
  // TEMA
  // =========================================================

  function Tema_Escuro() {
    setTema("black");
  }

  function Tema_Claro() {
    setTema("#e9eaecde");
  }

  // =========================================================
  // CARREGAR LIVROS
  // =========================================================

  async function carregarLivros() {
    try {
      const res = await fetch(`${API}/livros`, {
        method: "GET",
        cache: "no-store",
      });

      console.log("STATUS /livros:", res.status);

      if (!res.ok) {
        console.log("ERRO AO BUSCAR LIVROS:", res.status);
        return;
      }

      const data: Livro[] = await res.json();

      console.log("LIVROS RECEBIDOS:", data);

      setLivros(data);
    } catch (err) {
      console.log("ERRO AO CARREGAR LIVROS:", err);
    }
  }

  // Carregar livros ao abrir a tela
  useEffect(() => {
    carregarLivros();
  }, []);

  // =========================================================
  // SELECIONAR CAPA
  // =========================================================

  async function selecionarCapa() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const isPng = asset.uri.toLowerCase().endsWith(".png");

      setCapa({
        uri: asset.uri,
        blob,
        name: asset.fileName ?? (isPng ? "capa.png" : "capa.jpg"),
        type: isPng ? "image/png" : "image/jpeg",
      });
    }
  }

  // =========================================================
  // SELECIONAR PDF
  // =========================================================

  async function selecionarPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      setPdf({
        uri: asset.uri,
        name: asset.name ?? "livro.pdf",
        type: "application/pdf",
      });
    }
  }

  // =========================================================
  // SALVAR / EDITAR LIVRO
  // =========================================================

  async function salvarLivro() {
    if (!nome.trim() || !genero.trim()) {
      console.log("Nome ou gênero não preenchido.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("nome", nome.trim());
      formData.append("genero", genero.trim());
      formData.append("valor", String(Number(valor)));

      // CAPA
      if (capa) {
        const capaBlob = await fetch(capa.uri).then((r) => r.blob());

        formData.append(
          "capa",
          capaBlob,
          capa.name ?? "capa.jpg"
        );
      }

      // PDF
      if (pdf) {
        const pdfBlob = await fetch(pdf.uri).then((r) => r.blob());

        formData.append(
          "pdf",
          pdfBlob,
          pdf.name ?? "livro.pdf"
        );
      }

      let response;

      // EDITAR
      if (editId !== null) {
        response = await fetch(`${API}/livros/${editId}`, {
          method: "PUT",
          body: formData,
          cache: "no-store",
        });
      }

      // NOVO LIVRO
      else {
        response = await fetch(`${API}/livros`, {
          method: "POST",
          body: formData,
          cache: "no-store",
        });
      }

      const text = await response.text();

      console.log("STATUS SALVAR:", response.status);
      console.log("RESPOSTA:", text);

      if (!response.ok) {
        console.log("ERRO AO SALVAR LIVRO");
        return;
      }

      // =====================================================
      // BUSCAR NOVAMENTE OS LIVROS NA API
      // =====================================================

      await carregarLivros();

      // =====================================================
      // LIMPAR FORMULÁRIO
      // =====================================================

      setNome("");
      setGenero("");
      setValor("");
      setCapa(null);
      setPdf(null);
      setEditId(null);

      setModal(false);

    } catch (err) {
      console.log("ERRO AO SALVAR LIVRO:", err);
    }
  }

  // =========================================================
  // DELETAR
  // =========================================================

  async function deletar(id: number) {
    try {
      const response = await fetch(`${API}/livros/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      console.log("STATUS DELETE:", response.status);

      if (!response.ok) {
        console.log("ERRO AO DELETAR LIVRO");
        return;
      }

      await carregarLivros();

    } catch (err) {
      console.log("ERRO AO DELETAR:", err);
    }
  }

  // =========================================================
  // EDITAR
  // =========================================================

  function editar(item: Livro) {
    setNome(item.nome);
    setGenero(item.genero);
    setEditId(item.id);
    setModal(true);
    setValor(String(item.valor));
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: tema }}>

        {/* NAVBAR */}

        <SafeAreaView style={styles.navbar}>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
          >
            <Image
              source={Logout}
              style={styles.icon}
            />
          </TouchableOpacity>

          <Text
            style={{
              color: "white",
              fontSize: Mobile ? 16 : 20,
            }}
          >
            Olá, {usuario?.nome ?? "Usuário"}
          </Text>

          <TouchableOpacity
            onPress={
              tema === "#e9eaecde"
                ? Tema_Escuro
                : Tema_Claro
            }
          >
            <Image
              source={
                tema === "#e9eaecde"
                  ? Lua
                  : Sol
              }
              style={styles.icon}
            />
          </TouchableOpacity>

        </SafeAreaView>

        {/* LISTA DE LIVROS */}

        <FlatList
          data={livros}
          key={colunas}
          numColumns={colunas}
          keyExtractor={(i) => i.id.toString()}

          contentContainerStyle={{
            paddingVertical: 20,
            alignItems: "center",
          }}

          columnWrapperStyle={
            colunas > 1
              ? {
                  justifyContent: "center",
                }
              : undefined
          }

          renderItem={({ item }) => (

            <View
              style={{
                padding: 15,
                margin: 20,
                width: 650,
                height: 670,

                backgroundColor:
                  tema === "#e9eaecde"
                    ? "white"
                    : "#333",

                borderRadius: 20,

                alignItems: "center",
                justifyContent: "center",
              }}
            >

              {/* CAPA */}

              <Image
                source={{
                  uri: item.capa_url,
                }}
                style={styles.capa}
              />

              {/* NOME */}

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",

                  color:
                    tema === "#e9eaecde"
                      ? "#333"
                      : "white",
                }}
              >
                {item.nome}
              </Text>

              {/* GÊNERO */}

              <Text
                style={{
                  color:
                    tema === "#e9eaecde"
                      ? "#333"
                      : "white",
                }}
              >
                Genero: {item.genero}
              </Text>

              {/* VALOR */}

              <Text
                style={{
                  marginBottom: 10,

                  color:
                    tema === "#e9eaecde"
                      ? "#333"
                      : "white",
                }}
              >
                Valor: {item.valor} / Mês
              </Text>

              {/* BOTÕES */}

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                }}
              >

                <TouchableOpacity
                  onPress={() => editar(item)}
                  style={{
                    backgroundColor: "#fc4e03",
                    padding: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Editar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => deletar(item.id)}
                  style={{
                    backgroundColor: "red",
                    padding: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    Deletar
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

          )}
        />

        {/* BOTÃO + */}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {

            setNome("");
            setGenero("");
            setValor("");

            setCapa(null);
            setPdf(null);

            setEditId(null);

            setModal(true);
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 40,
              bottom: 5,
              fontWeight: "bold",
            }}
          >
            +
          </Text>
        </TouchableOpacity>

        {/* MODAL */}

        <Modal
          visible={modal}
          transparent
          animationType="slide"
        >

          <View style={styles.modal}>

            <View style={styles.modalBox}>

              {/* NOME */}

              <TextInput
                placeholder="Nome"
                value={nome}
                onChangeText={setNome}
                style={styles.input}
              />

              {/* GÊNERO */}

              <TextInput
                placeholder="Gênero"
                value={genero}
                onChangeText={setGenero}
                style={styles.input}
              />

              {/* CAPA */}

              <TouchableOpacity
                onPress={selecionarCapa}
                style={styles.input}
              >
                <Text
                  style={{
                    textAlign: "center",
                  }}
                >
                  {capa
                    ? capa.name
                    : "Selecionar Capa"}
                </Text>
              </TouchableOpacity>

              {/* PDF */}

              <TouchableOpacity
                onPress={selecionarPdf}
                style={styles.input}
              >
                <Text
                  style={{
                    textAlign: "center",
                  }}
                >
                  {pdf
                    ? pdf.name
                    : "Selecionar o PDF do Livro"}
                </Text>
              </TouchableOpacity>

              {/* VALOR */}

              <TextInput
                keyboardType="decimal-pad"
                placeholder="Digite o valor do livro"
                value={valor}
                onChangeText={setValor}
                style={styles.input}
              />

              {/* SALVAR */}

              <TouchableOpacity
                style={styles.btnSalvar}
                onPress={salvarLivro}
              >
                <Text
                  style={{
                    color: "white",
                  }}
                >
                  {editId !== null
                    ? "Atualizar"
                    : "Salvar"}
                </Text>
              </TouchableOpacity>

              {/* FECHAR */}

              <TouchableOpacity
                onPress={() => setModal(false)}
              >
                <Text
                  style={{
                    marginTop: 10,
                    color: "#cc1f00",
                  }}
                >
                  Fechar
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

// =========================================================
// ESTILOS
// =========================================================

const styles = StyleSheet.create({

  navbar: {
    width: "100%",
    height: 100,
    backgroundColor: "blue",

    flexDirection: "row",

    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 20,
  },

  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  fab: {
    position: "absolute",

    bottom: 30,
    right: 30,

    width: 70,
    height: 70,

    borderRadius: 50,

    backgroundColor: "blue",

    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    flex: 1,

    backgroundColor: "#000000aa",

    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",

    backgroundColor: "white",

    padding: 20,

    borderRadius: 10,
  },

  input: {
    borderWidth: 1,

    marginBottom: 10,

    padding: 10,

    borderRadius: 8,

    textAlign: "center",
  },

  btnSalvar: {
    backgroundColor: "green",

    padding: 10,

    alignItems: "center",

    borderRadius: 8,
  },

  capa: {
    width: 600,
    height: 500,

    borderRadius: 8,

    marginBottom: 10,
  },

});