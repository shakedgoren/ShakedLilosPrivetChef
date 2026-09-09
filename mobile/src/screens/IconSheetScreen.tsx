import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as I from '../icons';

/** מסך בדיקה זמני · מציג את כל האייקונים שנוצרו מהקנבס */
function Cell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <View style={s.cell}>
      {children}
      <Text style={s.label}>{name}</Text>
    </View>
  );
}

export function IconSheetScreen() {
  return (
    <ScrollView contentContainerStyle={s.wrap}>
        <Cell key="AlertCircle" name="AlertCircle"><I.AlertCircle size={28} /></Cell>
        <Cell key="AlertTriangle" name="AlertTriangle"><I.AlertTriangle size={28} /></Cell>
        <Cell key="ArrowLeft" name="ArrowLeft"><I.ArrowLeft size={28} /></Cell>
        <Cell key="Bag" name="Bag"><I.Bag size={28} /></Cell>
        <Cell key="BarChart" name="BarChart"><I.BarChart size={28} /></Cell>
        <Cell key="Bars" name="Bars"><I.Bars size={28} /></Cell>
        <Cell key="Bell" name="Bell"><I.Bell size={28} /></Cell>
        <Cell key="Board" name="Board"><I.Board size={28} /></Cell>
        <Cell key="Bookmark" name="Bookmark"><I.Bookmark size={28} /></Cell>
        <Cell key="Bowl" name="Bowl"><I.Bowl size={28} /></Cell>
        <Cell key="Box3D" name="Box3D"><I.Box3D size={28} /></Cell>
        <Cell key="Calendar" name="Calendar"><I.Calendar size={28} /></Cell>
        <Cell key="Camera" name="Camera"><I.Camera size={28} /></Cell>
        <Cell key="Cart" name="Cart"><I.Cart size={28} /></Cell>
        <Cell key="Check" name="Check"><I.Check size={28} /></Cell>
        <Cell key="ChevronDown" name="ChevronDown"><I.ChevronDown size={28} /></Cell>
        <Cell key="ChevronLeft" name="ChevronLeft"><I.ChevronLeft size={28} /></Cell>
        <Cell key="ChevronRight" name="ChevronRight"><I.ChevronRight size={28} /></Cell>
        <Cell key="Clock" name="Clock"><I.Clock size={28} /></Cell>
        <Cell key="Close" name="Close"><I.Close size={28} /></Cell>
        <Cell key="Copy" name="Copy"><I.Copy size={28} /></Cell>
        <Cell key="Download" name="Download"><I.Download size={28} /></Cell>
        <Cell key="FileText" name="FileText"><I.FileText size={28} /></Cell>
        <Cell key="Gift" name="Gift"><I.Gift size={28} /></Cell>
        <Cell key="Home" name="Home"><I.Home size={28} /></Cell>
        <Cell key="Image" name="Image"><I.Image size={28} /></Cell>
        <Cell key="Lock" name="Lock"><I.Lock size={28} /></Cell>
        <Cell key="LogIn" name="LogIn"><I.LogIn size={28} /></Cell>
        <Cell key="LogOut" name="LogOut"><I.LogOut size={28} /></Cell>
        <Cell key="Map" name="Map"><I.Map size={28} /></Cell>
        <Cell key="MapPin" name="MapPin"><I.MapPin size={28} /></Cell>
        <Cell key="Minus" name="Minus"><I.Minus size={28} /></Cell>
        <Cell key="Package" name="Package"><I.Package size={28} /></Cell>
        <Cell key="Pencil" name="Pencil"><I.Pencil size={28} /></Cell>
        <Cell key="Phone" name="Phone"><I.Phone size={28} /></Cell>
        <Cell key="PhoneCall" name="PhoneCall"><I.PhoneCall size={28} /></Cell>
        <Cell key="Platter" name="Platter"><I.Platter size={28} /></Cell>
        <Cell key="Plus" name="Plus"><I.Plus size={28} /></Cell>
        <Cell key="Receipt" name="Receipt"><I.Receipt size={28} /></Cell>
        <Cell key="Refresh" name="Refresh"><I.Refresh size={28} /></Cell>
        <Cell key="Search" name="Search"><I.Search size={28} /></Cell>
        <Cell key="Truck" name="Truck"><I.Truck size={28} /></Cell>
        <Cell key="Upload" name="Upload"><I.Upload size={28} /></Cell>
        <Cell key="User" name="User"><I.User size={28} /></Cell>
        <Cell key="UserCircle" name="UserCircle"><I.UserCircle size={28} /></Cell>
        <Cell key="UserSmall" name="UserSmall"><I.UserSmall size={28} /></Cell>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 4 },
  cell: { width: 80, height: 74, alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { fontSize: 8.5, color: '#8A8194', textAlign: 'center' },
});
