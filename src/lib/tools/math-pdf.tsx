import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", color: "#0f172a" },
  brand: { fontSize: 18, fontWeight: 700, color: "#1a4bdd" },
  tag: { fontSize: 9, color: "#64748b", marginTop: 2 },
  title: { fontSize: 20, fontWeight: 700, marginTop: 20 },
  meta: { fontSize: 10, color: "#64748b", marginTop: 4, marginBottom: 6 },
  infoRow: { flexDirection: "row", marginTop: 10, marginBottom: 14 },
  infoField: { flex: 1, borderBottom: "0.5 solid #94a3b8", marginRight: 10, minHeight: 14 },
  qRow: { flexDirection: "row", marginBottom: 10, flexWrap: "wrap" },
  q: { fontSize: 12, marginBottom: 8, width: "50%" },
  keyTitle: { fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10, color: "#1a4bdd" },
  keyRow: { fontSize: 11, marginBottom: 4 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#94a3b8", textAlign: "center" }
});

export interface MathQuestion {
  question: string;
  answer: string;
}

interface Props {
  title: string;
  grade: string;
  topic: string;
  questions: MathQuestion[];
}

export function MathWorksheetPDF({ title, grade, topic, questions }: Props) {
  return (
    <Document>
      {/* Page 1: worksheet */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>LEARNZO</Text>
        <Text style={styles.tag}>Math Practice - learnzo.online</Text>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{grade} | {topic} | {questions.length} questions</Text>

        <View style={styles.infoRow}>
          <Text>Name:</Text>
          <View style={styles.infoField} />
          <Text>Date:</Text>
          <View style={styles.infoField} />
        </View>

        {questions.map((q, i) => (
          <Text key={i} style={styles.q}>
            {i + 1}. {q.question}
          </Text>
        ))}

        <Text style={styles.footer}>Learnzo - Free printable worksheets for Indian families</Text>
      </Page>

      {/* Page 2: answer key */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>LEARNZO</Text>
        <Text style={styles.tag}>Answer Key - learnzo.online</Text>

        <Text style={styles.keyTitle}>Answer Key</Text>
        <Text style={styles.meta}>{title}</Text>

        {questions.map((q, i) => (
          <Text key={i} style={styles.keyRow}>
            {i + 1}. {q.answer}
          </Text>
        ))}

        <Text style={styles.footer}>Learnzo - Free printable worksheets for Indian families</Text>
      </Page>
    </Document>
  );
}