import { SpaceX } from "./api/spacex";
import * as d3 from "d3";
import GeoData from './geo.json'; 

const Geo = GeoData.default || GeoData;

document.addEventListener("DOMContentLoaded", setup);

function setup() {
    const spaceX = new SpaceX();
    const listContainer = document.getElementById("listContainer");

    // Загружаем и запуски, и стартовые площадки параллельно
    Promise.all([spaceX.launches(), spaceX.launchpads()])
        .then(([launches, launchpads]) => {
            renderLaunches(launches, listContainer, launchpads);
            drawMap(launchpads);})
        .catch(error => {
            console.error("Ошибка загрузки данных:", error);
            listContainer.innerHTML = `<p style="color:red; padding:10px;">Ошибка загрузки данных. Откройте консоль (F12) для деталей.</p>`;});}

function renderLaunches(launches, container, launchpads) {
    const list = document.createElement("ul");

    // Карта id -> площадка для быстрого поиска (если понадобится)
    const padMap = new Map();
    launchpads.forEach(pad => padMap.set(pad.id, pad));

    launches.forEach(launch => {
        const item = document.createElement("li");
        item.innerHTML = launch.name;
        const padId = launch.launchpad;
        item.dataset.launchpad = padId;

        // Подсветка точки при наведении
        item.addEventListener("mouseenter", () => {
            d3.select(`.launchpad-dot[data-id="${padId}"]`)
                .transition().duration(200)
                .attr("r", 9)
                .attr("fill", "#f1c40f");});

        // Возврат к обычному виду
        item.addEventListener("mouseleave", () => {
            d3.select(`.launchpad-dot[data-id="${padId}"]`)
                .transition().duration(200)
                .attr("r", 5)
                .attr("fill", "#e74c3c");});

        list.appendChild(item);});

    container.replaceChildren(list);}

function drawMap(launchpads) {
    const width = 640;
    const height = 480;
    const margin = { top: 20, right: 10, bottom: 40, left: 100 };

    const svg = d3.select('#map')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const projection = d3.geoMercator()
        .scale(70)
        .center([0, 20])
        .translate([width / 2 - margin.left, height / 2]);

    const path = d3.geoPath().projection(projection);

    // 1. Рисуем континенты
    svg.append("g")
        .selectAll("path")
        .data(Geo.features)
        .enter()
        .append("path")
        .attr("class", "topo")
        .attr("d", path)
        .attr("fill", "#ccc")
        .style("opacity", 0.7);

    // 2. Преобразуем launchpads в GeoJSON-точки
    const points = launchpads.map(pad => ({
        type: "Feature",
        properties: {
            name: pad.name,
            id: pad.id },
        geometry: {
            type: "Point",
            // ВАЖНО: порядок [долгота, широта]
            coordinates: [pad.longitude, pad.latitude]}}));

    // 3. Рисуем точки поверх карты
    svg.append("g")
        .selectAll("circle")
        .data(points)
        .enter()
        .append("circle")
        .attr("cx", d => projection(d.geometry.coordinates)[0])
        .attr("cy", d => projection(d.geometry.coordinates)[1])
        .attr("r", 5)
        .attr("fill", "#e74c3c")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("class", "launchpad-dot")
        .attr("data-id", d => d.properties.id)
        .append("title")
        .text(d => d.properties.name); }