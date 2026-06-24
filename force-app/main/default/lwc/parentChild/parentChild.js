import { LightningElement } from 'lwc';

export default class ParentChild extends LightningElement {
    parentMessage="Hi, message from parent"  
    messageChild;
    handleChild(evnt){
        this.messageChild= evnt.detail;
    }
}