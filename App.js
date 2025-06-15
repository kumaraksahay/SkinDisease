import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './screens/Home';
import Login from './screens/Login';
import Signup from './screens/Signup';
import Dashboard from './dashbo/Dashboard';
import DoctorPortal from './dashbo/DoctorPortal';
import DoctorDetail from './dashbo/DoctorDetail';
import AppointmentScheduler from './dashbo/AppointmentScheduler';
import UserEditProfile from './dashbo/UserEditProfile';

import CareGuide from './dashbo/CareGuide';
import DiseaseDetail from './disease/DiseaseDetail';
import ScanScreen from './skinscan/ScanScreen';
import DLogin from './doctorUI/DLogin';
import DoctorRegister from './doctorUI/DoctorRegister';
import ScheduleTime from './doctorUI/ScheduleTime';
import DashboardDoctor from './doctorUI/DashboardDoctor';

import ForgetPassword from './screens/ForgetPassword';
import NotificationD from './doctorUI/NotificationD';
import CameraScreen from './skinscan/CameraScreen';
import ForgetPasswords from './doctorUI/DForgetPasswords';
import ProfileDetailScreen from './doctorUI/ProfileDetailScreen';
import EditProfile from './doctorUI/EditProfile';
import FeedbackScreen from './doctorUI/FeedbackScreen';
import DForgetPassword from './doctorUI/DForgetPasswords';
import GetStart from './screens/GetStart';
import AppointmentManagement from './doctorUI/AppointmentManagement';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import AppointmentRequests from './doctorUI/AppointmentRequests';
import MyAppointment from './dashbo/MyAppointment';
import PatientInformation from './doctorUI/PatientInformation';
import DoctorSetting from './doctorUI/DoctorSetting';
import SettingsScreen from './dashbo/SettingsScreen';
import NotificationsScreen from './dashbo/NotificationsScreen';
import ProfileScreen from './dashbo/ProfileScreen';
import About from './dashbo/About';
import Support from './dashbo/Support';
import HelpScreen from './doctorUI/HelpScreen';
import ContactScreen from './doctorUI/ContactScreen';
import PrivacyScreen from './doctorUI/PrivacyScreen';
import TermScreen from './doctorUI/TermScreen';
import ChatView from './dashbo/ChatView';
import ChatWrite from './dashbo/ChatWrite';

import ChatDetailScreen from './doctorUI/ChatDetailScreen';
import PatientChatListScreen from './doctorUI/PatientChatListScreen';
import DoctorView from './doctorUI/DoctorView';
import PortalD  from './doctorUI/PortalD';
import PrescriptionForm from './doctorUI/PrescriptionForm';
import PrescriptionSummary from './doctorUI/PrescriptionForm';
import HeartRateScreen from './dashbo/HeartRateScreen';

import AdminDashboard from './admin/AdminDashboard';



const Stack = createNativeStackNavigator();
const getInitialRoute = () => {
  const userLoggedIn = false;
  return userLoggedIn ? 'GetStart' : 'GetStart';
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={getInitialRoute(GetStart)}>
        {/* Authentication Screens */}
        <Stack.Screen name="GetStart" component={GetStart} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
      
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
        
        {/* Use BottomTabNavigator as a Screen in the Stack */}
        <Stack.Screen name="BottomTabNavigator" component={BottomTabNavigator} options={{ headerShown: false }} />
        
        <Stack.Screen name="CareGuide" component={CareGuide} options={{headerShown:false }}  />
        <Stack.Screen name="DiseaseDetail" component={DiseaseDetail} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} options={{headerShown:false}}/>
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="UserEditProfile" component={UserEditProfile} options={{ headerShown: false }} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="NotificationsScreen" component={NotificationsScreen}  />
        <Stack.Screen name="ChatView" component={ChatView} options={{ headerShown: false}} />
        <Stack.Screen name="ChatWrite" component={ChatWrite} options={{ headerShown: false}} />
        <Stack.Screen name="HeartRateScreen" component={HeartRateScreen} options={{ headerShown: false}} />
         

        
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />

        
        {/* Doctor Register UI */}
        <Stack.Screen name="DLogin" component={DLogin} options={{ headerShown: false }} />
        <Stack.Screen name="DoctorRegister" component={DoctorRegister} options={{ headerShown: false }} />
        <Stack.Screen name="DForgetPassword" component={DForgetPassword} options={{ headerShown: false }} />
        <Stack.Screen name="AppointmentManagement" component={AppointmentManagement} options={{ headerShown: false }} />
        <Stack.Screen name="AppointmentRequests" component={AppointmentRequests} options={{ headerShown: false }} />
        <Stack.Screen name="MyAppointment" component={MyAppointment} options= {{ headerShown: false }} />
        <Stack.Screen name="PatientInformation" component={PatientInformation} options={{ headerShown: false }} />
        <Stack.Screen name="DoctorSetting" component={DoctorSetting} options={{ headerShown: false }} />
     
        <Stack.Screen name="ChatDetailScreen" component={ChatDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PatientChatListScreen" component={PatientChatListScreen} options={{ headerShown: false }} />
      
        <Stack.Screen name="NotificationD" component={NotificationD} options={{ headerShown: false }}  />
        <Stack.Screen name="DashboardDoctor" component={DashboardDoctor} options={{ headerShown: false }} />
        <Stack.Screen name="ScheduleTime" component={ScheduleTime} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileDetailScreen" component={ProfileDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false}}/>
        <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} options={{ headerShown: false}}/>
        <Stack.Screen name="PrescriptionForm" component={PrescriptionForm} options={{ headerShown: false}}/>
        <Stack.Screen name="PrescriptionSummary" component={PrescriptionSummary} options={{ headerShown: false}}/>

{/* Main App Screen */}

        {/* Main App Screen */}
        <Stack.Screen name="ScanScreen" component={ScanScreen} options={{ headerShown: false }} />
      
        {/* Screens for Doctor and Appointments */}
        <Stack.Screen name="DoctorPortal" component={DoctorPortal} options={{ headerShown: false }}  />
        <Stack.Screen name="DoctorDetail" component={DoctorDetail} options={{ headerShown: false }} />
        <Stack.Screen name="AppointmentScheduler" component={AppointmentScheduler} options={{ headerShown: false }} />
        <Stack.Screen name="DoctorView" component={DoctorView} options={{ headerShown: false}} />
        <Stack.Screen name="PortalD" component={PortalD} options={{ headerShown: false}} />

        <Stack.Screen name="HelpScreen" component={HelpScreen} options={{ headerShown: true}} />
      <Stack.Screen name="ContactScreen" component={ContactScreen} options={{ headerShown: true}} />
      <Stack.Screen name="PrivacyScreen" component={PrivacyScreen} options={{ headerShown: true}} />
      <Stack.Screen name="TermScreen" component={TermScreen}  options={{ headerShown: true}}/>

        <Stack.Screen name="About" component={About} options={{ headerShown: true}}/>
        <Stack.Screen name="Support" component={Support} options={{ headerShown: true}}/>
    
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;