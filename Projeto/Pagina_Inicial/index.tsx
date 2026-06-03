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

import Lua from "../assets/Lua_PixelArt.png";
import Sol from "../assets/Sol_PixelArt.png";
import Logout from "../assets/Logout.png";

const API = "http://10.0.10.177:8080/livros";

interface Usuario {
  nome: string;
}

interface Livro {
  _id: string;
  nome: string;
  genero: string;
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

export default function Inicio() {
  const { width } = useWindowDimensions();
  const Mobile = width < 600;

  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<InicioRouteProp>();

  const usuario = route.params?.usuario;

  const [tema, setTema] = useState<string>("#e9eaecde");
  const [modal, setModal] = useState<boolean>(false);

  const [livros, setLivros] = useState<Livro[]>([]);

  const [nome, setNome] = useState<string>("");
  const [genero, setGenero] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);

  function Tema_Escuro(): void {
    setTema("black");
  }

  function Tema_Claro(): void {
    setTema("#e9eaecde");
  }

  async function carregarLivros(): Promise<void> {
    try {
      const res = await fetch(API);
      const data: Livro[] = await res.json();
      setLivros(data);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    carregarLivros();
  }, []);

  async function salvarLivro(): Promise<void> {
    if (!nome.trim() || !genero.trim()) return;

    try {
      if (editId) {
        await fetch(`${API}/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            genero,
          }),
        });
      } else {
        await fetch(API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            genero,
          }),
        });
      }

      setNome("");
      setGenero("");
      setEditId(null);
      setModal(false);

      await carregarLivros();
    } catch (err) {
      console.log(err);
    }
  }

  async function deletar(id: string): Promise<void> {
    try {
      await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      await carregarLivros();
    } catch (err) {
      console.log(err);
    }
  }

  function editar(item: Livro): void {
    setNome(item.nome);
    setGenero(item.genero);
    setEditId(item._id);
    setModal(true);
  }

  const isDark = tema === "black";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, backgroundColor: tema }}>
          <SafeAreaView style={styles.navbar}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
            >
              <Image source={Logout} style={styles.icon} />
            </TouchableOpacity>

            <Text
              style={{
                color: "white",
                fontSize: Mobile ? 16 : 20,
                fontWeight: "bold",
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

          <FlatList<Livro>
            data={livros}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 20 }}
            style={{
              backgroundColor: isDark
                ? "#1F1F1F"
                : "transparent",
            }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark
                      ? "#2A2A2A"
                      : "#fff",
                    width: Mobile ? "100%" : "90%",
                    alignSelf: "center",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: Mobile ? 16 : 18,
                    fontWeight: "bold",
                    color: isDark ? "white" : "black",
                  }}
                >
                  {item.nome}
                </Text>

                <Text
                  style={{
                    color: isDark ? "#ccc" : "#333",
                  }}
                >
                  {item.genero}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <TouchableOpacity
                    style={styles.btnEditar}
                    onPress={() => editar(item)}
                  >
                    <Text style={{ color: "white" }}>
                      Editar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnDelete}
                    onPress={() => deletar(item._id)}
                  >
                    <Text style={{ color: "white" }}>
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
              setEditId(null);
              setModal(true);
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 40,
                fontWeight: "bold",
                marginBottom: 5,
              }}
            >
              +
            </Text>
          </TouchableOpacity>

          <Modal
            visible={modal}
            transparent
            animationType="slide"
          >
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

                <TouchableOpacity
                  style={styles.btnSalvar}
                  onPress={salvarLivro}
                >
                  <Text style={{ color: "white" }}>
                    {editId
                      ? "Atualizar"
                      : "Salvar"}
                  </Text>
                </TouchableOpacity>

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
      </ScrollView>
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

  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "blue",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
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
  },

  btnSalvar: {
    backgroundColor: "green",
    padding: 10,
    alignItems: "center",
    borderRadius: 8,
  },

  btnEditar: {
    backgroundColor: "orange",
    padding: 8,
    borderRadius: 5,
  },

  btnDelete: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 5,
  },
});