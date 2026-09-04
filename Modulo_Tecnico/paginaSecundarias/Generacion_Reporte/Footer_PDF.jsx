import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 30, // Ajusta la posición según sea necesario
        left: 50,
        width: "100%",
    },
    H1: {
        fontSize: 12, // Puedes ajustar el tamaño de la fuente
        textAlign: "center",
    }
});

const FooterPDF = () => {
    return (
        <View style={styles.container} fixed>
            
        </View>
    );
};

export default FooterPDF;