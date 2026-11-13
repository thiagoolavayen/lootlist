/** Registro, acceso y sesión persistente con Supabase Auth. */
import { supabase } from './supabaseClient.js?v=20261113-4';
export async function obtenerSesion(){const {data,error}=await supabase.auth.getSession();if(error)throw error;return data.session;}
export async function registrarse(email,password){
  const {data,error}=await supabase.auth.signUp({email,password});
  if(error)throw error;return data;
}
export async function iniciarSesion(email,password){const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;return data;}
export async function cerrarSesion(){const {error}=await supabase.auth.signOut();if(error)throw error;}
export function escucharSesion(callback){return supabase.auth.onAuthStateChange((_evento,sesion)=>callback(sesion));}
