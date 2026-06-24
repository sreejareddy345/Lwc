import { LightningElement ,api} from 'lwc';

export default class ChildComp extends LightningElement {
    @api message;
    handleClick(){
        const evnt= new CustomEvent('notify', {detail : 'Hi from child!'});
        this.dispatchEvent(evnt);

    }
}