import React, { useEffect, useRef, useState } from 'react';
import { select, geoPath, geoMercator, geoCentroid } from 'd3';
import { feature } from 'topojson-client';
import boundaryData from './data/India ADM2 GeoBoundaries.json';

// Only replace trade data with S3 URL
const TRADE_URL = 'https://muhurat-trading.s3.eu-north-1.amazonaws.com/data-muhurat/grouped_trades_final_1_cleaned.json';

const ExactLocationMapNew = () => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const activeCircles = useRef([]);
  const [tradeData, setTradeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Add data fetching effect for trade data only
  useEffect(() => {
    const fetchTradeData = async () => {
      try {
        // Use fetch with progress tracking
        const response = await fetch(TRADE_URL);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');

        let receivedLength = 0;
        let chunks = [];

        while(true) {
          const {done, value} = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          // Update progress
          setLoadingProgress((receivedLength / contentLength) * 100);
        }

        // Combine chunks and parse JSON
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for(let chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }
        
        const data = JSON.parse(new TextDecoder().decode(chunksAll));
        
        // Process data to optimize rendering
        const processedData = Object.fromEntries(
          Object.entries(data).map(([time, trades]) => [
            time,
            trades.map(trade => ({
              location: trade.location,
              buy_sell: trade.buy_sell
              // Only keep necessary properties
            }))
          ])
        );

        setTradeData(processedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching trade data:', error);
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, []);

  // Main visualization effect
  useEffect(() => {
    if (isLoading || !tradeData || !svgRef.current || !wrapperRef.current) return;

    if (!svgRef.current || !wrapperRef.current) return;

    // Convert TopoJSON to GeoJSON
    // We'll use the first available object if there is one
    const objectName = Object.keys(boundaryData.objects)[0];
    const geojson = feature(boundaryData, boundaryData.objects[objectName]);
    
    if (!geojson) {
      console.error('Failed to convert TopoJSON to GeoJSON');
      return;
    }

    const centroid = geoCentroid(geojson);

    // Clear previous content
    select(svgRef.current).selectAll("*").remove();

    // Set up dimensions
    const width = wrapperRef.current.clientWidth;
    const padding = 0.15;
    const timelineHeight = 100;
    const spacingFromMap = 60;
    const maxBarHeight = 50;

    // Calculate the padded dimensions
    const paddedWidth = width * (1 - padding);
    const paddedHeight = window.innerHeight * 0.9 * (1 - padding);
    const paddingHeight = window.innerHeight * 0.9 * padding;

    const totalHeight = window.innerHeight * 0.9 + timelineHeight + spacingFromMap;

    // Create SVG first
    const svg = select(svgRef.current)
      .attr("width", width)
      .attr("height", totalHeight)
      .style("background-color", "#181818");

    // Create map group with adjusted position
    const mapGroup = svg.append("g")
      .attr("transform", `translate(${(width - paddedWidth) / 2}, ${paddingHeight / 2})`);

    // Set up time variables
    const timeKeys = Object.keys(tradeData).sort();
    const startTime = parseInt(timeKeys[0]);
    const endTime = parseInt(timeKeys[timeKeys.length - 1]);
    let currentTime = startTime;

    // Create projection and render map first
    const projection = geoMercator()
      .center(centroid)
      .fitSize([paddedWidth, paddedHeight], geojson);

    // Create path generator and render map paths
    const pathGenerator = geoPath().projection(projection);
    mapGroup.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", "#262626")
      .attr("stroke", "#565656")
      .attr("stroke-width", 0.5)
      .attr("class", "district");

    // Calculate timeline dimensions after map is rendered
    const mapBBox = mapGroup.node().getBBox();
    const timelineWidth = mapBBox.width;
    const timelineX = (width - timelineWidth) / 2;

    // Calculate total minutes and bar width
    const totalMinutes = Math.ceil((endTime - startTime) / 60000);
    const barWidth = timelineWidth / totalMinutes;

    // Create timeline group
    const timelineGroup = svg.append("g")
      .attr("transform", `translate(${timelineX}, ${totalHeight - timelineHeight})`);

    // Add timeline background bar
    timelineGroup.append("rect")
      .attr("width", timelineWidth)
      .attr("height", 8)
      .attr("fill", "#2e2e2e")
      .attr("rx", 4);

    // Add progress bar
    const progressBar = timelineGroup.append("rect")
      .attr("width", 0)
      .attr("height", 8)
      .attr("fill", "#FFFFFF")
      .attr("rx", 4);

    // Add time labels
    timelineGroup.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("text-anchor", "start")
      .text(new Date(startTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));

    timelineGroup.append("text")
      .attr("x", timelineWidth)
      .attr("y", 20)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("text-anchor", "end")
      .text(new Date(endTime).toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));

    // Group trades by minute for histogram
    const tradesByMinute = {};
    timeKeys.forEach(timeKey => {
      const minute = Math.floor(parseInt(timeKey) / 60000) * 60000;
      tradesByMinute[minute] = (tradesByMinute[minute] || 0) + tradeData[timeKey].length;
    });

    // Calculate max trades per minute for scaling
    const maxTradesPerMinute = Math.max(...Object.values(tradesByMinute));

    const renderCircles = (trades) => {
      // Pre-calculate coordinates and add them to the circle data
      const newCircles = trades.map(trade => {
        const { location, buy_sell } = trade;
        let coordinates = null;
        
        if (location && location.latitude && location.longitude) {
          coordinates = projection([
            parseFloat(location.longitude),
            parseFloat(location.latitude),
          ]);
        }
        
        return {
          coordinates,
          buy_sell,
          startTime: performance.now(),
        };
      });
      
      activeCircles.current = [...activeCircles.current, ...newCircles];

      // Reduce total animation duration (currently 30 seconds)
      const totalDuration = 9000;  // Change to 2 seconds
      const displayDuration = 0;
      const initialRadius = 3;     // Smaller radius = less pixels to render
      
      const animate = (timestamp) => {
        ctx.clearRect(0, 0, width, totalHeight);
        
        ctx.globalCompositeOperation = 'screen';
        
        activeCircles.current = activeCircles.current.filter(circle => {
          const elapsed = timestamp - circle.startTime;
          
          if (elapsed >= totalDuration || !circle.coordinates) return false;
          
          let scale = 1;
          if (elapsed > displayDuration) {
            scale = 1 - ((elapsed - displayDuration) / totalDuration);
            if (scale <= 0) return false;
          }

          if (scale > 0) {
            // Draw outer circle with scaling radius (20% opacity)
            ctx.fillStyle = 'rgba(250, 183, 38, 0.1)';  // #FAB726 with 0.2 opacity
            ctx.beginPath();
            ctx.arc(
              circle.coordinates[0], 
              circle.coordinates[1], 
              12 * scale,  // Scale from 9px to 0px
              0, 
              2 * Math.PI
            );
            ctx.fill();

            // Draw inner circle (fixed 3px, full opacity)
            ctx.fillStyle = '#FAB726';  // Original color
            ctx.beginPath();
            ctx.arc(
              circle.coordinates[0], 
              circle.coordinates[1], 
              2,  // Fixed 3px radius for inner circle
              0, 
              2 * Math.PI
            );
            ctx.fill();
          }
          
          return true;
        });

        if (activeCircles.current.length > 0) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    const updateTrades = () => {
      // Display current time
      const currentDate = new Date(currentTime);
      
      // Update progress bar
      const progress = (currentTime - startTime) / (endTime - startTime);
      progressBar.attr("width", timelineWidth * progress);

      // Calculate which minute we're currently in
      const currentMinute = Math.floor(currentTime / 60000) * 60000;
      
      // Render histogram bar for the current minute
      const trades = tradesByMinute[currentMinute] || 0;
      
      if (trades > 0) {
        const barHeight = (trades / maxTradesPerMinute) * maxBarHeight;
        const minutePosition = ((currentMinute - startTime) / (endTime - startTime)) * timelineWidth;
        
        timelineGroup.append("rect")
          .attr("x", minutePosition)
          .attr("y", -barHeight)
          .attr("width", Math.max(1, barWidth - 1))  // Ensure minimum width of 1px
          .attr("height", barHeight)
          .attr("fill", "#565656")
          .attr("opacity", 0)
          .transition()
          .duration(500)
          .attr("opacity", 0.5);
      }

      // Render circles for all trades in the current second
      if (tradeData[currentTime]) {
        requestAnimationFrame(() => {
          renderCircles(tradeData[currentTime]);
        });
      }

      // Increment time to next available timestamp
      const currentIndex = timeKeys.indexOf(currentTime.toString());
      if (currentIndex < timeKeys.length - 1) {
        currentTime = parseInt(timeKeys[currentIndex + 1]);
      } else {
        clearInterval(timeInterval);
      }
    };

    const timeInterval = setInterval(updateTrades, 1000); // Update every 200ms

    // Add a canvas layer for circles
    const canvas = svg.append("foreignObject")
      .attr("width", width)
      .attr("height", totalHeight)
      .style("transform", `translate(${(width - paddedWidth) / 2}px, ${paddingHeight / 2}px)`)
      .append("xhtml:canvas")
      .attr("width", width)
      .attr("height", totalHeight);

    const ctx = canvas.node().getContext("2d");

    return () => clearInterval(timeInterval); // Clean up the interval on unmount

  }, [isLoading, tradeData]);

  // Show loading progress
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-white">
          Loading trade data... {Math.round(loadingProgress)}%
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{width: `${loadingProgress}%`}}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div ref={wrapperRef} className="relative w-full">
        <svg
          ref={svgRef}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  );
};

export default ExactLocationMapNew;
