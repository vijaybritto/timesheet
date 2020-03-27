import { h } from 'preact';

const TextField = props => (<label class="block p-3 pt-0 pb-2" >
        <span class="text-gray-700 text-sm">{props.placeholder}</span>
		<input class="form-input mt-1 block w-11/12" {...props} />
	</label>);

export default TextField;