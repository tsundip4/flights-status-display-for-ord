import * as d3 from "d3";

export function renderArrivalsDeparturesChart(svgEl, data) {
  const width = 320;
  const height = 180;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };

  const svg = d3.select(svgEl);
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const root = svg.selectAll("g.root").data([null]);
  const rootEnter = root
    .enter()
    .append("g")
    .attr("class", "root")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const rootMerge = rootEnter.merge(root);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, chartWidth])
    .padding(0.4);
  const maxValue = Math.max(1, d3.max(data, (d) => d.value));
  const y = d3.scaleLinear().domain([0, maxValue]).nice().range([chartHeight, 0]);

  rootMerge
    .selectAll("g.axis-x")
    .data([null])
    .join((enter) => enter.append("g").attr("class", "axis-x"))
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  rootMerge
    .selectAll("g.axis-y")
    .data([null])
    .join((enter) => enter.append("g").attr("class", "axis-y"))
    .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0));

  const bars = rootMerge.selectAll("rect.bar").data(data, (d) => d.label);

  bars
    .join(
      (enter) =>
        enter
          .append("rect")
          .attr("class", "bar")
          .attr("x", (d) => x(d.label))
          .attr("width", x.bandwidth())
          .attr("y", chartHeight)
          .attr("height", 0)
          .transition()
          .duration(500)
          .attr("y", (d) => y(d.value))
          .attr("height", (d) => chartHeight - y(d.value)),
      (update) =>
        update
          .transition()
          .duration(500)
          .attr("x", (d) => x(d.label))
          .attr("width", x.bandwidth())
          .attr("y", (d) => y(d.value))
          .attr("height", (d) => chartHeight - y(d.value)),
      (exit) => exit.remove()
    );
}
