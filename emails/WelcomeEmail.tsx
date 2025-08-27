
import * as React from "react";
import { Html, Head, Preview, Body, Container, Text, Heading } from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to CupCircle ☕</Preview>
    <Body style={{ fontFamily: "K2D, sans-serif", backgroundColor: "#f9f9f9", padding: "20px" }}>
      <Container style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px" }}>
        <Heading style={{ fontSize: "22px", marginBottom: "12px", color: "#333" }}>
          Welcome to CupCircle!
        </Heading>
        <Text style={{ fontSize: "16px", color: "#333", lineHeight: "1.5" }}>
          Hi {name}, <br /><br />
          Thanks for joining CupCircle — your neighborhood coffee chat network.  
          We're excited to help you meet new people and grow your connections ☕.
        </Text>
        <Text style={{ fontSize: "16px", color: "#333", lineHeight: "1.5", marginTop: "16px" }}>
          Here's what you can do next:
        </Text>
        <Text style={{ fontSize: "14px", color: "#333", marginLeft: "16px" }}>
          • Complete your profile to attract meaningful connections<br />
          • Set your availability for coffee chats<br />
          • Browse and connect with local professionals<br />
          • Discover great cafes in your neighborhood
        </Text>
        <Text style={{ fontSize: "14px", color: "#666", marginTop: "20px" }}>
          You'll receive reminders before your chats. In the meantime, explore and start connecting!
        </Text>
        <Text style={{ fontSize: "12px", color: "#999", marginTop: "24px" }}>
          Happy networking,<br />
          The CupCircle Team
        </Text>
      </Container>
    </Body>
  </Html>
);
