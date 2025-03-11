import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login & Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CupCircle</Text>
      <Text style={styles.subtitle}>Where every cup connects</Text>

      {/* Toggle Buttons */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          onPress={() => setIsLogin(true)}
          style={[styles.switchButton, isLogin && styles.activeButton]}
        >
          <Text style={isLogin ? styles.activeText : styles.inactiveText}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsLogin(false)}
          style={[styles.switchButton, !isLogin && styles.activeButton]}
        >
          <Text style={!isLogin ? styles.activeText : styles.inactiveText}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Register has extra fields */}
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
          />
        </>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          console.log(isLogin ? "Logging in..." : "Registering...")
        }
      >
        <Text style={styles.buttonText}>{isLogin ? "Login" : "Register"}</Text>
      </TouchableOpacity>

      {/* Optional Sign-in with LinkedIn (Login Only) */}
      {isLogin && (
        <TouchableOpacity
          style={styles.linkedInButton}
          onPress={() => console.log("Login with LinkedIn")}
        >
          <Text style={styles.linkedInText}>Sign in with LinkedIn</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#E76F51" },
  subtitle: { fontSize: 16, color: "#757575", marginBottom: 20 },
  switchContainer: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
  },
  switchButton: { padding: 10, paddingHorizontal: 30, borderRadius: 20 },
  activeButton: { backgroundColor: "#E76F51" },
  activeText: { color: "#fff", fontWeight: "bold" },
  inactiveText: { color: "#757575" },
  input: {
    width: "80%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    width: "80%",
    backgroundColor: "#E76F51",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontSize: 16 },
  linkedInButton: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#E76F51",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
  },
  linkedInText: { color: "#E76F51", fontSize: 16 },
});
