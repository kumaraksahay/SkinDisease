import React from 'react';
import { StyleSheet, Text, View, ImageBackground} from 'react-native';


const Background=({children})=> {
  return (
    <View>
      
        <ImageBackground source ={require("../src/assets/leaves.jpeg")} style ={{height:'100%'}}>
        

        <View>
            {children}
            </View>
            </ImageBackground>
            </View>
        
    
    
    

  );
}

export default Background;