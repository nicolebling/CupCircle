import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { Button, Card, Divider } from "react-native-paper";

// Mock Legal Content Modal
const LegalContent = ({ type, isOpen, onClose }) => (
  <Modal visible={isOpen} transparent>
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10 }}>
        <Text>
          {type === "terms" ? "Terms & Conditions" : "Privacy Policy"}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: "blue", marginTop: 10 }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function AuthPage() {
  const { login, register } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values, action) => {
    try {
      setIsLoading(true);
      const result =
        action === "login" ? await login(values) : await register(values);

      if (!result.ok) {
        toast({
          title: "Authentication Failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome to CoffeeChat!",
        description:
          action === "login"
            ? "Successfully logged in!"
            : "Account created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#f9f9f9",
      }}
    >
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#673ab7" }}>
          CupCircle
        </Text>
        <Text style={{ color: "#666" }}>Where every cup connects</Text>
      </View>

      <Card style={{ padding: 20, borderRadius: 10 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <TouchableOpacity onPress={() => reset({ email: "", password: "" })}>
            <Text style={{ fontWeight: "bold" }}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => reset({ email: "", password: "" })}>
            <Text style={{ fontWeight: "bold" }}>Register</Text>
          </TouchableOpacity>
        </View>

        <Divider />

        {/* Email Input */}
        <Text style={{ marginTop: 10 }}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 5,
                marginBottom: 10,
              }}
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
            />
          )}
        />

        {/* Password Input */}
        <Text>Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                padding: 10,
                borderRadius: 5,
                marginBottom: 10,
              }}
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />
          )}
        />

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit((data) => onSubmit(data, "login"))}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="white" /> : "Login"}
        </Button>

        <TouchableOpacity
          onPress={() => {
            setIsLoading(true);
            Linking.openURL("https://www.linkedin.com/oauth").finally(() =>
              setIsLoading(false),
            );
          }}
          style={{
            marginTop: 10,
            alignItems: "center",
            padding: 10,
            backgroundColor: "#0077b5",
            borderRadius: 5,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white" }}>Sign in with LinkedIn</Text>
          )}
        </TouchableOpacity>

        <Text
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#666",
            marginTop: 5,
          }}
        >
          You'll be redirected to LinkedIn for authentication.
        </Text>

        {/* Legal Links */}
        <Text style={{ textAlign: "center", fontSize: 12, marginTop: 10 }}>
          By signing up, you agree to our{" "}
          <Text
            style={{ color: "blue" }}
            onPress={() => setShowTermsOfService(true)}
          >
            Terms and Conditions
          </Text>{" "}
          and{" "}
          <Text
            style={{ color: "blue" }}
            onPress={() => setShowPrivacyPolicy(true)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </Card>

      {/* Legal Content Modals */}
      <LegalContent
        type="privacy"
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
      <LegalContent
        type="terms"
        isOpen={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
      />
    </View>
  );
}
