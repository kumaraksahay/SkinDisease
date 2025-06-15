import { StyleSheet, Text, TextInput } from 'react-native';
import React from 'react';
import { darkGreen } from '../src/Constants';

export default function Field(props) {
    return (
        <TextInput
            {...props}
            style={{ 
                borderRadius: 100, 
             
                paddingHorizontal: 15, 
                width: '70%', 
                backgroundColor: '#f3f3f3' ,
                marginRight:'80',
                marginVertical:20,
                height:50,
               
            }}
           
        />
    );
}

const styles = StyleSheet.create({});
