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
  ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Inicio: {
    usuario: {
      id: number;
      nome: string;
      email: string;
      credito: number;
      tipo: string;
    };
    token: string;
  };
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const API_URL = "https://paginariumapi.onrender.com";

function interpretarResposta(texto: string): any {
  if (!texto) return {};

  try {
    return JSON.parse(texto);
  } catch {
    return { message: texto };
  }
}

function mensagemDaResposta(data: any, fallback: string): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.mensagem === "string" && data.mensagem.trim()) {
    return data.mensagem;
  }

  if (typeof data?.erro === "string" && data.erro.trim()) {
    return data.erro;
  }

  return fallback;
}

export default function Cadastro() {
  const navigation = useNavigation<NavigationProps>();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmar_email, setConfirmar_Email] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar_senha, setConfirmar_Senha] = useState("");

  const [erro, setErro] = useState("");
  const [janelaModal, setModal] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);

  function mostrarErro(mensagem: string) {
    setErro(mensagem);
    setModal(true);
  }

  async function cadastro() {
    if (cadastrando) return;

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const emailConfirmado = confirmar_email.trim().toLowerCase();

    if (
      !nomeLimpo ||
      !emailLimpo ||
      !emailConfirmado ||
      !senha ||
      !confirmar_senha
    ) {
      mostrarErro("Não pode deixar campos vazios.");
      return;
    }

    if (emailLimpo !== emailConfirmado) {
      mostrarErro("Os e-mails não coincidem.");
      return;
    }

    if (senha !== confirmar_senha) {
      mostrarErro("As senhas não coincidem.");
      return;
    }

    setCadastrando(true);

    try {
      const response = await fetch(`${API_URL}/cadastro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeLimpo,
          email: emailLimpo,
          senha,
        }),
      });

      const responseText = await response.text();
      const data = interpretarResposta(responseText);

      // Verifica primeiro o status HTTP.
      if (!response.ok) {
        mostrarErro(
          mensagemDaResposta(
            data,
            `Não foi possível concluir o cadastro (HTTP ${response.status}).`
          )
        );
        return;
      }

      // O cadastro foi concluído. Agora tentamos fazer login.
      let loginRes: Response;

      try {
        loginRes = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailLimpo,
            senha,
          }),
        });
      } catch {
        mostrarErro(
          "Cadastro concluído, mas não foi possível entrar automaticamente. Feche esta mensagem e entre pela tela de Login."
        );
        return;
      }

      const loginText = await loginRes.text();
      const loginData = interpretarResposta(loginText);

      if (
        !loginRes.ok ||
        typeof loginData?.token !== "string" ||
        !loginData?.usuario
      ) {
        mostrarErro(
          "Cadastro concluído, mas o login automático não funcionou. Feche esta mensagem e entre pela tela de Login."
        );
        return;
      }

      await AsyncStorage.setItem("token", loginData.token);

      await AsyncStorage.setItem(
        "usuario",
        JSON.stringify(loginData.usuario)
      );

      navigation.navigate("Inicio", {
        usuario: loginData.usuario,
        token: loginData.token,
      });
    } catch (error) {
      console.log("ERRO NO CADASTRO:", error);

      mostrarErro(
        "Não foi possível comunicar com o servidor. Se o cadastro já apareceu no banco, tente fazer login em vez de cadastrar novamente."
      );
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, backgroundColor: "#e9eaecde" }}>
            <View style={styles.container}>
              <View style={styles.card}>
                <Text style={styles.title}>Cadastro</Text>

                <TextInput
                  placeholder="Nome"
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  editable={!cadastrando}
                />

                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!cadastrando}
                />

                <TextInput
                  placeholder="Confirmar Email"
                  style={styles.input}
                  value={confirmar_email}
                  onChangeText={setConfirmar_Email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!cadastrando}
                />

                <TextInput
                  placeholder="Senha"
                  secureTextEntry
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                  editable={!cadastrando}
                />

                <TextInput
                  placeholder="Confirmar Senha"
                  secureTextEntry
                  style={styles.input}
                  value={confirmar_senha}
                  onChangeText={setConfirmar_Senha}
                  editable={!cadastrando}
                />

                <TouchableOpacity
                  onPress={cadastro}
                  style={[
                    styles.button,
                    cadastrando && { opacity: 0.7 },
                  ]}
                  disabled={cadastrando}
                >
                  {cadastrando ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Cadastrar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  disabled={cadastrando}
                >
                  <Text style={styles.link}>Fazer Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={janelaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setModal(false)}
      >
        <View style={modal.fundo}>
          <View style={modal.caixa}>
            <Text
              style={{
                color: "#222",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
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
    padding: 12,
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
    marginBottom: 35,
    marginTop: 30,
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
    minHeight: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
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
    padding: 20,
  },

  caixa: {
    width: "100%",
    maxWidth: 340,
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