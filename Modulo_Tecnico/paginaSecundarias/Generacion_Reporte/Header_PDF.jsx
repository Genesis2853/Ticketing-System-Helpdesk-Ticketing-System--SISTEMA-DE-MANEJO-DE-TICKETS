import React from "react";
import { View, Image, StyleSheet } from "@react-pdf/renderer";
import logo from './logo.png';

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 20,
        left: 50,
        width: "100%",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 120,
        height: 40,
        objectFit: 'contain',
    },
});

const HeaderPDF = () => {
    return (
        <View style={styles.container} fixed>
            <Image 
                src={logo}
                style={styles.image} 
            />
        </View>
    );
};

export default HeaderPDF;
