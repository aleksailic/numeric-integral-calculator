Chart.pluginService.register({
    beforeInit: function(chart) {
        // We get the chart data
        let data = chart.config.data;

        // For every dataset ...
        for (let i = 0; i < data.datasets.length; i++) {
            // For every label ...
            for (let j = 0; j < data.labels.length; j++) {
                // We get the dataset's function and calculate the value
                let fct = data.datasets[i].function,
                    x = data.labels[j],
                    y = math.eval(fct,{'x':x});
                // Then we add the value to the dataset data
                data.datasets[i].data.push(y);
            }
        }
    }
});

let app=(function(){
    let Plot=new function(){
        this.id='plot';
        this.points=10000;
        this.range=[-1, 1];
        this.chart={};
        let self=this;

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

        this.init=function(){
            const ctx=document.getElementById(self.id).getContext('2d');
            self.chart=new Chart(ctx,{
                type: 'line',
                data: {
                    labels: calcLabel(),
                    datasets: [
                    {
                        label: "f(x) = tan(x)",
                        function: 'tan(x)',
                        data: [],
                        borderColor: "rgba(0, 102, 255, 1)",
                        fill: false,
                        cubicInterpolationMode: 'monotone',
                        pointRadius:0
                    }]
                },
                options: {

                }
            });

        };
    };

    window.addEventListener("load",function(){
        Plot.init();
        let control = new dat.GUI();

        control.add(Plot,'points',0,100);
        control.add(Plot,'init');
    });
})();