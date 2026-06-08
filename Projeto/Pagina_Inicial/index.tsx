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
import Opcoes_Clara from "../assets/Opcoes_Clara.png";
import Opcoes_Escura from "../assets/Opcoes_Escura.png";
import Fechar from "../assets/Fechar.png";
import Lupa from "../assets/Lupa.png";

const API = "http://10.0.10.209:8080/livros";

interface Usuario {
  nome: string;
}

interface Livro {
  id: number;
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

  const [tema, setTema] = useState("#e9eaecde");
  const [modal, setModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [livros, setLivros] = useState<Livro[]>([]);

  const [nome, setNome] = useState("");
  const [genero, setGenero] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  
  function Tema_Escuro() {
    setTema("black");
  }

  function Tema_Claro() {
    setTema("#e9eaecde");
  }

  async function carregarLivros() {
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


  const isDark = tema === "black";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, backgroundColor: tema }}>
          <SafeAreaView style={styles.navbar}>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Image source={Logout} style={styles.icon} />
            </TouchableOpacity>

            <Text style={{ color: "white", fontSize: Mobile ? 16 : 20, fontWeight: "bold" }}>
              Olá, {usuario?.nome ?? "Usuário"}
            </Text>

            <TouchableOpacity onPress={tema === "#e9eaecde" ? Tema_Escuro : Tema_Claro}>
              <Image source={tema === "#e9eaecde" ? Lua : Sol} style={styles.icon} />
            </TouchableOpacity>
          </SafeAreaView>

          <FlatList
            data={livros}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 20 }}
            style={{ backgroundColor: isDark ? "#1F1F1F" : "transparent" }}
            renderItem={({ item }) => (
              <View style={[styles.card, {
                backgroundColor: isDark ? "#2A2A2A" : "#fff",
                width: Mobile ? "100%" : "90%",
                alignSelf: "center",
              }]}>
                <Text style={{ fontSize: Mobile ? 16 : 18, fontWeight: "bold", color: isDark ? "white" : "black" }}>
                  {item.nome}
                </Text>

                <Text style={{ color: isDark ? "#ccc" : "#333" }}>
                  {item.genero}
                </Text>

                {/* <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={styles.btnEditar} onPress={() => editar(item)}>
                    <Text style={{ color: "white" }}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnDelete} onPress={() => deletar(item.id)}>
                    <Text style={{ color: "white" }}>Deletar</Text>
                  </TouchableOpacity>
                </View> */}
              </View>
            )}
          />

        </View>

        <View style={{ position: "absolute", top:100, backgroundColor: tema === "#e9eaecde" ? "white" : "#333", width:"100%", justifyContent:"center", height:80}}>
            <TouchableOpacity
              style={{
                backgroundColor:
                  tema === "#e9eaecde" ? "white" : "#333", 
                padding: 10,
                width: 60,
                left:15,
              }}
              onPress={() => setMenuVisible(true)}
            >
              <Image
                source={tema === "#e9eaecde" ? Opcoes_Escura : Opcoes_Clara}
                style={styles.icon}
              />
            </TouchableOpacity>

            <Modal
              visible={menuVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setMenuVisible(false)}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    width: 500,
                    height:"100%",
                    padding: 20,
                    position:"absolute",
                    top:100,
                    left:0,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      marginBottom: 70,
                    }}
                  >
                    Menu
                  </Text>

                  <TouchableOpacity
                    style={{
                      width: "100%",
                      padding: 10,
                      backgroundColor: "#ad000e",
                      borderRadius: 8,
                      marginBottom: 30,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        textAlign: "center",
                      }}
                    >
                      Configurações
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      width: "100%",
                      padding: 10,
                      backgroundColor: "#ad000e",
                      borderRadius: 8,
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        textAlign: "center",
                      }}
                    >
                      Meus Livros
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setMenuVisible(false)}
                    style={{
                      padding: 10,
                      position:"absolute", 
                      top: 5,
                      right: 5
                    }}
                  >
        
                      <Image source={Fechar} style={{width:30,height:30}}/>

                  </TouchableOpacity>

                </View>
              </View>
            </Modal>
            <View style={{alignItems:"center"}}>
              <TextInput
                placeholder="Digite o nome do livro ou Genero dele..."
                style={styles.input}
              />
                <TouchableOpacity
                   style={{
                    position: "absolute",
                    top: 40,  
                    marginStart: 395,
                    width: 50,
                    height: 50,
                    backgroundColor: "white",
                    justifyContent: "center",
                    alignItems: "center",

                    borderTopWidth: 2,
                    borderRightWidth: 2,
                    borderBottomWidth: 2,

                    borderTopColor: "black",
                    borderRightColor: "black",
                    borderBottomColor: "black",

                    borderLeftWidth: 0,
                  }}
                >
                <Image source={Lupa} style={{ width: 30, height: 30 }} />
              </TouchableOpacity>
            </View>
            
          </View>

         
        
      </ScrollView>
    </KeyboardAvoidingView>
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

  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    top: 200
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
    width:350,
    height: 50,
    textAlign: "center",
    borderColor: "black",
    borderWidth: 2,
    position:"absolute",
    top:40,
    backgroundColor:"white",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,


  },

  btnSalvar: {
    backgroundColor: "green",
    padding: 10,
    alignItems: "center",
    borderRadius: 8,
  },

});