import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Inicio: {
    usuario: {
      nome: string;
      email: string;
    };
  };
};

type NavigationProps =
  NativeStackNavigationProp<RootStackParamList>;

interface CadastroResponse {
  message?: string;
  usuario?: {
    nome: string;
    email: string;
  };
}

// const API_URL = "http://10.0.10.209:8080";
const API_URL = "https://paginariumapi-production.up.railway.app";

export default function Cadastro() {
  const navigation = useNavigation<NavigationProps>();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmar_email, setConfirmar_Email] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar_senha, setConfirmar_Senha] = useState("");

  const [erro, setErro] = useState("");
  const [janelaModal, setModal] = useState(false);

  async function cadastro() {
    try {
      if (
        !nome.trim() ||
        !email.trim() ||
        !confirmar_email.trim() ||
        !senha.trim() ||
        !confirmar_senha.trim()
      ) {
        setErro("Não pode deixar campos vazios");
        setModal(true);
        return;
      }

      if (email !== confirmar_email) {
        setErro("Emails não coincidem");
        setModal(true);
        return;
      }

      if (senha !== confirmar_senha) {
        setErro("Senhas não coincidem");
        setModal(true);
        return;
      }

      const response = await fetch(`${API_URL}/cadastro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
        }),
      });

      // proteção contra HTML vindo do backend
      const text = await response.text();
      let data: CadastroResponse;

      try {
        data = JSON.parse(text);
      } catch {
        setErro("Servidor retornou resposta inválida");
        setModal(true);
        return;
      }

      if (!response.ok) {
        setErro(data.message || "Erro ao cadastrar");
        setModal(true);
        return;
      }

      navigation.navigate("Inicio", {
        usuario: {
          nome: data.usuario?.nome || nome,
          email: data.usuario?.email || email,
        },
      });

    } catch (error) {
      console.log("ERRO:", error);
      setErro("Erro de conexão com o servidor");
      setModal(true);
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, backgroundColor: "#e9eaecde" }}>
            <View style={styles.container}>
              <View style={styles.card}>
                <Text style={styles.title}>Cadastro</Text>

                <TextInput placeholder="Nome" style={styles.input} value={nome} onChangeText={setNome} />
                <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
                <TextInput placeholder="Confirmar Email" style={styles.input} value={confirmar_email} onChangeText={setConfirmar_Email} />
                <TextInput placeholder="Senha" secureTextEntry style={styles.input} value={senha} onChangeText={setSenha} />
                <TextInput placeholder="Confirmar Senha" secureTextEntry style={styles.input} value={confirmar_senha} onChangeText={setConfirmar_Senha} />

                <TouchableOpacity onPress={cadastro} style={styles.button}>
                  <Text style={styles.buttonText}>Cadastrar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.link}>Fazer Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={janelaModal} transparent animationType="fade">
        <View style={modal.fundo}>
          <View style={modal.caixa}>
            <Text style={{ color: "red", marginBottom: 20, textAlign: "center" }}>
              {erro}
            </Text>

            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={modal.botao}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: 600,
    minHeight: 500,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },

  title: {
    marginBottom: 50,
    marginTop:50,
    fontSize: 40,
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    textAlign: "center",
    borderColor: "black",
    borderWidth: 2,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "blue",
    width: "100%",
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign:"center"
  },

  link: {
    marginTop: 15,
    color: "#0c9dc2",
    fontWeight: "bold",
  },
});

const modal = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  caixa: {
    width: 300,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },

  botao: {
    backgroundColor: "red",
    color: "white",
    padding: 10,
    borderRadius: 10,
    width: 100,
    textAlign: "center",
  },
});