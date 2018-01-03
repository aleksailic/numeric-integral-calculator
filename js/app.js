if (!Array.prototype.forEach) //polyfill for forEach
    Array.prototype.forEach = function(callback/*, thisArg*/) {
        let T, k;
        if (this == null) {
            throw new TypeError('this is null or not defined');
        }
        let O = Object(this);
        let len = O.length >>> 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = arguments[1];
        }
        k = 0;
        while (k < len) {
            let kValue;
            if (k in O) {
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };

let app=(function(){
    let Plot=new function(){
        const self=this;
        this.id='plot';
        this.options={
            target: '#'+this.id,
            width: 1000,
            height: 400,
            domainX:{
                a:-0,
                b:2
            },
            domainY:{
                min:-1,
                max:4
            },
            xAxis: {
                label: 'x - axis',
                domain:[0, 0]
            },
            yAxis: {
                label: 'y - axis',
                domain:[0, 0]
            },
            data: [{
                fn: 'x^2'
            }]
        };
        this.integration={
            types: {
                TRAPEZNA: 'trapezna',
                SIMPSONOVA: 'simpsonova',
                ROMBERGOVA: 'rombergova',
            },
            from: self.options.domainX.a,
            to: self.options.domainX.b,
            points:4
        };

        let calcLabel=function(){
            let dist=(Math.abs(self.range[0])+Math.abs(self.range[1]))/self.points;

            let curr=self.range[0];
            let arr=[];
            for(let i=0;i<=self.points;i++){
                arr.push(curr.toFixed(2));
                curr+=dist;
            }
            return arr;
        };
        let removeIntegrationElements=function(){
           let fn = self.options.data[0];
           self.options.data=[];
           self.options.data.push(fn);
            document.querySelectorAll('.graph').forEach((el)=>{
                el.remove();
            });
        };
        let setDomain=function(){
            self.options.xAxis.domain[0]=self.options.domainX.a;
            self.options.xAxis.domain[1]=self.options.domainX.b;

            self.options.yAxis.domain[0]=self.options.domainY.min;
            self.options.yAxis.domain[1]=self.options.domainY.max;
        };

        this.changeFunction=function(val){
            self.options.data=[{
                fn:val
            }];
            //self.options.title='y = '+val;
            removeIntegrationElements();
            self.update();
        };
        this.init=function(){
            console.log('init');
            document.getElementById("plot").innerHTML="";
            removeIntegrationElements();
            setDomain();
            functionPlot(self.options);
        };
        this.update=function(){
            setDomain();
            functionPlot(self.options);
        };

        this.integrate=function(type){
            const TYPES=self.integration.types;
            const FORMAT_PRECISION=5;
            removeIntegrationElements();

            let table=document.getElementById('integration-data');
            table.innerHTML=`
                <thead class="thead-dark">
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Range</th>
                    <th scope="col">Value</th>
                    <th scope="col">Error</th>
                </tr>
                </thead>
            `;

            let findDerivative=function(fn,n){
                for(let i=0;i<(n || 1);i++)
                    fn = math.derivative(fn.toString(),'x');
                return fn;
            };

            const a=self.integration.from;
            const b=self.integration.to;
            const points=self.integration.points;
            const h=math.eval(`(${b}-${a})/${points}`);

            const fn = self.options.data[0].fn;
            const derivative_order= (type==TYPES.TRAPEZNA) ? 2 : 4;
            const derivative = findDerivative(fn,derivative_order);

            let integralVal=0;
            let counter=1;

            switch(type){
                case TYPES.TRAPEZNA:
                    for (let i=a;counter<=points;++counter,i=math.add(i,h)){
                        let x1=i;
                        let x2=math.add(i,h);
                        let y1=math.eval(fn,{x:x1});
                        let y2=math.eval(fn,{x:x2});

                        let f = `${y1}+((${y2}-${y1})/(${x2}-${x1}))*(x-${x1})`;
                        let val=math.eval(`((${x2}-${x1})/2)*(${y2}+${y1})`);

                        integralVal=math.add(integralVal,val);

                        // --- error calculation ---
                        let fksi;
                        let step = math.eval(`${h}/10`);
                        for(let j=i;j<math.add(i,h);j=math.add(j,step)){
                            let val = math.eval(derivative.toString(),{x: j});
                            fksi=fksi || val;
                            if(val>fksi)
                                fksi=val;
                        }

                        let error = math.eval(`(-1/12)*${fksi}*(${x2}-${x1})^3`);
                        let error_format=math.format(error,{notation: 'exponential', precision: FORMAT_PRECISION});
                            error_format=error_format.replace(/e/,' 10^');
                        // ---------------------------

                        table.innerHTML+=`
                            <tr>
                                <th scope="row">${counter}</th>
                                <td>[${math.format(x1,FORMAT_PRECISION)} ${math.format(x2,FORMAT_PRECISION)}]</td>
                                <td>${math.format(val,{notation: 'fixed', precision: FORMAT_PRECISION})}</td>
                                <td>${error_format}</td>
                            </tr>
                        `;

                        //crtaj trapeze
                        self.options.data.push({
                            fn:f,
                            range: [x1, x2],
                            closed: true
                        });
                    }
                    self.update();
                    break;
                case TYPES.SIMPSONOVA:
                    for (let i=a;i<b;i+=h){
                        let x0=i;
                        let x1=math.eval(`${i}+${h}/2`);
                        let x2=math.add(i,h);

                        let y0=math.eval(fn,{x:x0});
                        let y1=math.eval(fn,{x:x1});
                        let y2=math.eval(fn,{x:x2});

                        //let f = `${y1}+((${y2}-${y1})/(${x2}-${x1}))*(x-${x1})`;
                        let val=math.eval(`(${h}/3)*(${y0}+4*${y1}+${y2})`);

                        integralVal=math.add(integralVal,val);

                        let izvod=math.derivative(fn, 'x'); //prvi izvod\
                        izvod=math.derivative(izvod.toString(),'x');
                        izvod=math.derivative(izvod.toString(),'x');
                        izvod=math.derivative(izvod.toString(),'x'); //cetvrti

                        let fksi;
                        let step = math.eval(`${h}/10`);
                        for(let j=i;j<i+h;j+=step){
                            let val = math.eval(izvod.toString(),{x: j});
                            fksi=fksi || val;
                            if(val>fksi)
                                fksi=val;
                        }

                        let error = math.eval(`(1/90)*${fksi}*((${h}/2)^5)`);

                        let error_format=math.format(error,{notation: 'exponential', precision: 5});
                        error_format=error_format.replace(/e/,' 10^');

                        table.innerHTML+=`
                            <tr>
                                <th scope="row">${counter}</th>
                                <td>[${x1} ${x2}]</td>
                                <td>${math.format(val,{notation: 'fixed', precision: 5})}</td>
                                <td>${izvod}</td>
                                <td>${error_format}</td>
                            </tr>
                        `;
                        counter++;
                    }
                    table.innerHTML+=`
                        <tr>
                            <th scope="row"></th>
                            <td>[${a} ${b}]</td>
                            <td>${math.format(integralVal,{notation: 'fixed', precision: 5})}</td>
                            <td></td>
                            <td></td>
                        </tr>
                    `;

                    self.update();
                    break;
                default:
                    console.log("Not yet implemented!");
                    break;
            }

            //dodaj glavni rezultat u tabelu
            table.innerHTML+=`
                <tr>
                    <th scope="row"></th>
                    <td>[${a} ${b}]</td>
                    <td>${math.format(integralVal,{notation: 'fixed', precision: 5})}</td>
                    <td></td>
                </tr>
            `;
        }
    };

    window.addEventListener("load",function(){
        Plot.init();
        let control = new dat.GUI();

        let graph=control.addFolder("Plot");

        let domainX=graph.addFolder('domainX');
        domainX.add(Plot.options.domainX,'a');
        domainX.add(Plot.options.domainX,'b');

        let domainY=graph.addFolder('domainY');
        domainY.add(Plot.options.domainY,'min');
        domainY.add(Plot.options.domainY,'max');


        graph.add(Plot.options,'width');
        graph.add(Plot.options,'height');
        graph.add(Plot,'init');

        let integration=control.addFolder("Integration");
        integration.add(Plot.integration,'from');
        integration.add(Plot.integration,'to');
        integration.add(Plot.integration,'points');

    });

    return Plot;
})();