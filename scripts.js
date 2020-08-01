

let tracker_app = new Vue({
	el : '#tracker-app',
	data : {
		tasks : [],
		statuses : {
			'light' : 'Еще не начат',
			'primary' : 'В работе',
			'secondary' : 'На паузе',
			'success' : 'Завершен',
		},
		statusesVerb : {
			'primary' : {
				heading : 'В работу',
				text_input : 'Пора что-то делать ...',
				btn_text : 'Начать работу',
			},
			'secondary' : {
				heading : 'На паузу',
				text_input : 'Пойду поем чуть-чуть...',
				btn_text : 'Поставить на паузу',
			},
			'success' : {
				heading : 'Завершение',
				text_input : 'Вроде все, осталось все остальное ...',
				btn_text : 'Завершить',
			},
		},
	},
	created : function(){
		let tracker_app = localStorage.getItem('tracker_app');
		if (tracker_app)
			this.tasks = JSON.parse(tracker_app);
	},
	updated : function(){
		localStorage.setItem('tracker_app', JSON.stringify(this.tasks));
	},
	methods : {
		action : function(){
			let task_id = this.$refs.confirm_task_id.value*1;
			let btn_stat = this.$refs.confirm_btn_stat.value;
			let cmt = this.$refs.confirm_text_input.value;

			let change = true;
			let times_last_index = this.tasks[task_id].times.length-1;

			switch(btn_stat) {
				case 'primary' /*В работу*/:
					this.tasks[task_id].times.push({
						title : cmt,
						start : new Date().getTime(),
						end : 0,
						comment : '',
					});
					break;

				case 'secondary' /*На паузу*/:
					this.tasks[task_id].times[times_last_index].comment = cmt;
					this.tasks[task_id].times[times_last_index].end = new Date().getTime();
					break;

				case 'success' /*Завершение*/:
					this.tasks[task_id].times[times_last_index].comment = cmt;

					/* делаем проверку, на случае если перед этим работа была приостановлена */
					if (!this.tasks[task_id].times[times_last_index].end)
						this.tasks[task_id].times[times_last_index].end = new Date().getTime();
					break;

				default: 
					change = false;
			}

			if (change) {
				this.tasks[task_id].status = btn_stat;
				event.target.reset();
				modalClose();
			}
		},
		switchStatus : function(task_id, btn_stat){

			window.modalOpen('', '#' + 'confirm-edit');

			this.$refs.confirm_heading.innerText = this.statusesVerb[btn_stat].heading;
			this.$refs.confirm_btn_text.innerText = this.statusesVerb[btn_stat].btn_text;

			this.$refs.confirm_btn_stat.value = btn_stat;
			this.$refs.confirm_task_id.value = task_id;

			this.$refs.confirm_text_input.setAttribute('placeholder', this.statusesVerb[btn_stat].text_input);

			if (btn_stat == 'success') {
				this.$refs.confirm_text_input.value = this.tasks[task_id].times[this.tasks[task_id].times.length-1].comment;
			}


		},
		addProject : function(){
			
			let title = this.$refs.new_title.value;
			let desc = this.$refs.new_desc.value;
			let rate = this.$refs.new_rate.value;

			if (!title) {
				return;
			}

			this.tasks.unshift({
				title : title,
				desc : desc,
				rate : rate,
				paid : 0,
				status : 'light',
				show_times : false,
				times : [],
			});

			modalClose();
			this.$refs.new_title.form.reset();
		},
		remove : function(){
			let task_id = this.$refs.task_id.value;
			this.tasks.splice(task_id, 1);

			modalClose();
			this.$refs.new_title.form.reset();
		},
		removeConfirm : function(task_id){

			window.modalOpen('', '#' + 'confirm-remove');
			this.$refs.remove_task_title.innerText = this.tasks[task_id].title;
			this.$refs.task_id.value = task_id;
		},
		getProcessInfo : function(task){
			let all_ts = 0;
			let rate = task.rate;

			for (time of task.times) {
				let start = time.start;
				let end = time.end;

				if ( !end )
					end = new Date().getTime();
				
				all_ts += end - start;
			}
			let minutes = all_ts / (1000 * 60).toFixed() * 1;
			let hours = all_ts / (1000 * 60 * 60);
			let money = (hours * rate).toFixed();
			
			return {
				'time' : this.getPassedTime(all_ts),
				'money' : money,
			};
		},
		getStringifyDate : function(ts){
			let d = new Date(ts);
			let s = '';
				s += ((d.getHours() < 10)?'0':'') + d.getHours();
				s += ':';
				s += ((d.getMinutes() < 10)?'0':'') + d.getMinutes();
				s += ' в ';
				s += ((d.getDate() < 10)?'0':'') + d.getDate();
				s += '.';
				s += ((d.getFullYear() < 10)?'0':'') + d.getFullYear();
				s += '.';
				s += (((d.getMonth()+1) < 10)?'0':'') + (d.getMonth()+1);

			return s;
		},
		getPassedTime : function(ts){
			if (!ts) return null;

			let hours = parseInt(ts / (60 * 60 * 1000));
			let minutes = parseInt(ts / (60 * 1000)) % 60;
			let seconds = parseInt(ts / (1000)) % 60;
			
			let time_arr = [];

			if (hours)
				time_arr.push(hours + 'ч');
			if (minutes)
				time_arr.push(minutes + 'м');
			if (seconds)
				time_arr.push(seconds + 'с');
			
			return time_arr.join(', ');
		},

		getHeight : function(el) {
			var el_style      = window.getComputedStyle(el),
				el_display    = el_style.display,
				el_position   = el_style.position,
				el_visibility = el_style.visibility,
				el_max_height = el_style.maxHeight.replace('px', '').replace('%', ''),

				wanted_height = 0;


			// if its not hidden we just return normal height
			if(el_display !== 'none' && el_max_height !== '0') {
				return el.offsetHeight;
			}

			// the element is hidden so:
			// making the el block so we can meassure its height but still be hidden
			el.style.position   = 'absolute';
			el.style.visibility = 'hidden';
			el.style.display    = 'block';

			wanted_height     = el.offsetHeight;

			// reverting to the original values
			el.style.display    = el_display;
			el.style.position   = el_position;
			el.style.visibility = el_visibility;

			return wanted_height;
		},
		toggleSlide : function(el, dur) {

			let height = 0;
				dur = dur || 300;
			
			el.style.overflow = 'hidden';

			el.style['transition'] = 'max-height '+ dur/1000 +'s ease-in-out';
			
			if (getComputedStyle(el).display == 'none') {
				height = this.getHeight(el);
				el.style.maxHeight = '0px';
				el.style.display = 'block';
			} else {
				el.style.maxHeight = el.scrollHeight + 'px';
			}

			setTimeout(function(){
				el.style.maxHeight = height + 'px';
			}, 10);

			setTimeout(function(){

				el.style.overflow = '';

				if (el.style.maxHeight == '0px') {
					el.style.display = 'none';
				}
				el.style.maxHeight = '';

			}, dur+1);

		},
		toggleTimes : function(e, box){
			let this_btn = e.target;

			this.toggleSlide(this.$refs[box][0]);

			if (this_btn.getAttribute('data-replace-text') == this_btn.innerText) {
				this_btn.innerText = this_btn.getAttribute('data-orgin-text');
			} else {
				this_btn.innerText = this_btn.getAttribute('data-replace-text');
			}
		}
	}
});

/* костыл для обновления/пересчета данных во Vue */
setInterval( () => {
	tracker_app.$forceUpdate();
}, 1000);



/**
*  modals
**/

/** modal opening **/
function modalOpen(event, id){
	if (event) event.preventDefault();
	
	modalClose();

	document.querySelectorAll(".modals," + id).forEach(function(element){
		element.classList.add('show');
	});
};

/** modal closing **/
function modalClose(event){
	if (event) event.preventDefault();

	document.querySelectorAll(".modals, .modals__item").forEach(function(element){
		element.classList.remove('show');
	});

	document.querySelectorAll(".modals form").forEach(function(element){
		element.reset();
	});

};
