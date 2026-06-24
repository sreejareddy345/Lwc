import { LightningElement,wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountCont.getAccounts';
const COLUMNS=[
    { label:'Name' , fieldName: 'Name' , type:'text'},
{ label:'Id' , fieldName: 'Id' , type:'text'},
{ label:'Phone' , fieldName: 'Phone' , type:'Number'}
];

export default class DataTable extends LightningElement {
    columns= COLUMNS;
    @wire(getAccounts) accounts;
}