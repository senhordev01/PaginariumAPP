import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Modal,
  FlatList,
} from "react-native";

import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import Lua from "../assets/Lua_PixelArt.png";
import Sol from "../assets/Sol_PixelArt.png";
import Logout from "../assets/Logout.png";

const API = "https://paginariumapi-production.up.railway.app";

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

  const usuario = route.params?.usuario;

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

  function Tema_Escuro() {
    setTema("black");
  }

  function Tema_Claro() {
    setTema("#e9eaecde");
  }

  async function carregarLivros() {
    try {
      const res = await fetch(`${API}/livros`);
      const data: Livro[] = await res.json();
      setLivros(data);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    carregarLivros();
  }, []);

  async function selecionarCapa() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const isPng = asset.uri.endsWith(".png");

      setCapa({
        uri: asset.uri,
        blob,
        name: asset.fileName ?? (isPng ? "capa.png" : "capa.jpg"),
        type: isPng ? "image/png" : "image/jpeg",
      });
    }
  }

  async function selecionarPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      setPdf({
        uri: asset.uri,
        name: asset.name ?? "livro.pdf",
        type: "application/pdf",
      });
    }
  }

  async function salvarLivro() {
    if (!nome.trim() || !genero.trim()) return;

    try {
      const formData = new FormData();

      formData.append("nome", nome.trim());
      formData.append("genero", genero.trim());
      formData.append("valor", String(Number(valor)));

      if (capa) {
        const capaBlob = await fetch(capa.uri).then(r => r.blob());
        formData.append("capa", capaBlob, capa.name ?? "capa.jpg");
      }

      if (pdf) {
        const pdfBlob = await fetch(pdf.uri).then(r => r.blob());
        formData.append("pdf", pdfBlob, pdf.name ?? "livro.pdf");
      }

      let response;

      if (editId !== null) {
        response = await fetch(`${API}/livros/${editId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch(`${API}/livros`, {
          method: "POST",
          body: formData,
        });
      }

      const text = await response.text();

      console.log("STATUS:", response.status);
      console.log("RES:", text);

      if (!response.ok) return;

      await carregarLivros();

      setNome("");
      setGenero("");
      setValor("");
      setCapa(null);
      setPdf(null);
      setEditId(null);
      setModal(false);

    } catch (err) {
      console.log(err);
    }
  }

  async function deletar(id: number) {
    try {
      await fetch(`${API}/livros/${id}`, {
        method: "DELETE",
      });

      await carregarLivros();
    } catch (err) {
      console.log(err);
    }
  }

  function editar(item: Livro) {
    setNome(item.nome);
    setGenero(item.genero);
    setEditId(item.id);
    setModal(true);
    setValor(String(item.valor));
  }
  
  return (
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: tema }}>
          <SafeAreaView style={styles.navbar}>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Image source={Logout} style={styles.icon} />
            </TouchableOpacity>

            <Text style={{ color: "white", fontSize: Mobile ? 16 : 20 }}>
              Olá, {usuario?.nome ?? "Usuário"}
            </Text>

            <TouchableOpacity onPress={tema === "#e9eaecde" ? Tema_Escuro : Tema_Claro}>
              <Image source={tema === "#e9eaecde" ? Lua : Sol} style={styles.icon} />
            </TouchableOpacity>
          </SafeAreaView>

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
                  backgroundColor: tema === "#e9eaecde" ? "white" : "#333",
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={{ uri: item.capa_url }}
                  style={styles.capa}
                />

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: tema === "#e9eaecde" ? "#333" : "white",
                  }}
                >
                  {item.nome}
                </Text>

                <Text
                  style={{
                    color: tema === "#e9eaecde" ? "#333" : "white",
                  }}
                >
                  Genero:{item.genero}
                </Text>

                <Text
                  style={{
                    marginBottom: 10,
                    color: tema === "#e9eaecde" ? "#333" : "white",
                  }}
                >
                 Valor:{item.valor} / Mês
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => editar(item)}
                    style={{
                      backgroundColor: "#fc4e03",
                      padding: 10,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
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
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Deletar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setNome("");
              setGenero("");
              setCapa(null);
              setPdf(null);
              setEditId(null);
              setModal(true);
            }}
          >
            <Text style={{ color: "white", fontSize: 40, bottom:5, fontWeight:"bold"}}>+</Text>
          </TouchableOpacity>

          <Modal visible={modal} transparent animationType="slide">
            <View style={styles.modal}>
              <View style={styles.modalBox}>
                <TextInput
                  placeholder="Nome"
                  value={nome}
                  onChangeText={setNome}
                  style={styles.input}
                />

                <TextInput
                  placeholder="Gênero"
                  value={genero}
                  onChangeText={setGenero}
                  style={styles.input}
                />

                <TouchableOpacity onPress={selecionarCapa} style={styles.input}>
                  <Text style={{textAlign:"center"}}>
                    {capa
                      ? `${capa.name}`
                      : "Selecionar Capa"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={selecionarPdf} style={styles.input}>
                  <Text style={{textAlign:"center"}}>
                    {pdf 
                      ? `${pdf.name}`
                      : "Selecionar o PDF do Livro" 
                    }
                  </Text>
                </TouchableOpacity> 
                
                <TextInput
                  keyboardType="decimal-pad"
                  placeholder="Digite o valor do livro"
                  value={valor}
                  onChangeText={setValor}
                  style={styles.input}
                />

                <TouchableOpacity style={styles.btnSalvar} onPress={salvarLivro}>
                  <Text style={{ color: "white" }}>
                    {editId !== null ? "Atualizar" : "Salvar"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setModal(false)}>
                  <Text style={{ marginTop: 10, color: "#cc1f00" }}>
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
  icon: { width: 40, height: 40, resizeMode: "contain" },

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
    textAlign:"center"
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