import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", color: "#0f172a" },
  brand: { fontSize: 18, fontWeight: 700, color: "#1a4bdd" },
  tag: { fontSize: 9, color: "#64748b", marginTop: 2 },
  title: { fontSize: 22, fontWeight: 700, marginTop: 20, textAlign: "center" },
  subtitle: { fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 4, marginBottom: 20 },
  row: { marginBottom: 14 },
  rowText: { fontSize: 26, color: "#cbd5e1", letterSpacing: 6, marginBottom: 4 },
  baseline: { borderBottom: "1 dotted #94a3b8", height: 1 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#94a3b8", textAlign: "center" }
});

interface Props {
  text: string;
  style: "trace" | "copy" | "both";
  rows: number;
}

function Row({ text, reps }: { text: string; reps: number }) {
  const items = Array.from({ length: reps });
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>
        {items.map((_, i) => text + "  ").join("")}
      </Text>
      <View style={styles.baseline} />
    </View>
  );
}

export function HandwritingPDF({ text, style, rows }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>LEARNZO</Text>
        <Text style={styles.tag}>Handwriting Practice - learnzo.online</Text>

        <Text style={styles.title}>{text}</Text>
        <Text style={styles.subtitle}>
          {style === "trace" ? "Trace the words" : style === "copy" ? "Copy the words" : "Trace once, then write"}
        </Text>

        {Array.from({ length: rows }).map((_, i) => (
          <Row key={i} text={text} reps={4} />
        ))}

        <Text style={styles.footer}>Learnzo - Free printable worksheets for Indian families</Text>
      </Page>
    </Document>
  );
}