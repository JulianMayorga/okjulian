import React, { useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import { useDrag } from "react-dnd";

export default function Draw() {
  const [rectangles, setRectangles] = useState([]);

  return (
    <DndProvider backend={Backend}>
      <div style={{ width: "100%", border: "solid 1px #999" }}>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            data-testid="sidebar"
            style={{
              flexBasis: "100px",
              borderRight: "solid 1px #999",
              paddingTop: 50,
            }}
          >
            {rectangles.map((rectangle) => (
              <RectangleInfo key={rectangle.id} rectangle={rectangle} />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: "100%",
                height: 50,
                borderBottom: "solid 1px #999",
                padding: 10,
                display: "flex",
                alignItems: "center",
              }}
            >
              <RectangleCreator
                onCreate={(rectangle) => {
                  setRectangles([...rectangles, rectangle]);
                }}
              />
            </div>
            <Canvas>
              {rectangles.map((rectangle) => (
                <Rectangle
                  onMove={(updatedRectangle) => {
                    setRectangles(
                      rectangles.map((rectangle) => {
                        if (rectangle.id !== updatedRectangle.id) {
                          return rectangle;
                        }
                        return { ...rectangle, ...updatedRectangle };
                      })
                    );
                  }}
                  key={rectangle.id}
                  rectangle={rectangle}
                />
              ))}
            </Canvas>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

function RectangleInfo({ rectangle }) {
  return (
    <div
      className="rectangle-info"
      style={{
        display: "flex",
        justifyContent: "center",
        padding: 10,
        color: "#999",
      }}
    >
      <div style={{ display: "flex" }}>
        <div className="x-position">[{Math.trunc(rectangle.x)},</div>
        <div className="y-position">{Math.trunc(rectangle.y)}]</div>
      </div>
    </div>
  );
}

/**
 * Container that allows dropping items onto it
 */
function Canvas({ children }) {
  let canvasRef;
  const [, drop] = useDrop({
    accept: [ItemTypes.RECTANGLE_CREATOR, ItemTypes.RECTANGLE],
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (item.type === ItemTypes.RECTANGLE_CREATOR) {
        item.dropPosition = viewportToCanvasPosition(canvasRef, {
          x: clientOffset.x,
          y: clientOffset.y,
        });
      } else if (item.type === ItemTypes.RECTANGLE) {
        item.dropPosition = viewportToCanvasPosition(canvasRef, {
          x: clientOffset.x,
          y: clientOffset.y,
        });
      }
      return { name: "Canvas", allowedDropEffect: "any" };
    },
  });
  return (
    <div
      data-testid="canvas"
      ref={(element) => {
        canvasRef = element;
        drop(element);
      }}
      style={{
        width: "100%",
        height: 500,
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}

const ItemTypes = {
  RECTANGLE_CREATOR: "rectangle_creator",
  RECTANGLE: "rectangle",
};

/**
 * Element that can be dragged onto the canvas to create rectangles on the dropped position
 */
function RectangleCreator({ onCreate }) {
  const width = 60;
  const height = 60;
  const [, drag] = useDrag({
    item: { type: ItemTypes.RECTANGLE_CREATOR, width, height },
    end: (item, monitor) => {
      if (item.dropPosition) {
        const id = Date.now().toString();
        const rectangle = {
          id,
          // Subtract width and height to anchor on the middle, not top-left
          x: item.dropPosition.x - width / 2,
          y: item.dropPosition.y - height / 2,
          width,
          height,
        };
        onCreate(rectangle);
      }
    },
  });
  return (
    <>
      <div
        ref={drag}
        data-testid="rectangle-creator"
        style={{ backgroundColor: "#999", width: 30, height: 30 }}
      ></div>
    </>
  );
}

/**
 * Displays rectangle that can be moved by dragging it on the canvas
 */
function Rectangle({ rectangle, onMove }) {
  const setPosition = ({ x, y }) => {
    onMove({
      ...rectangle,
      // Subtract width and height to anchor on the middle, not top-left
      x: x - rectangle.width / 2,
      y: y - rectangle.height / 2,
    });
  };
  const [{ isDragging }, drag] = useDrag({
    item: {
      type: ItemTypes.RECTANGLE,
      width: rectangle.width,
      height: rectangle.height,
    },
    end: (item) => {
      if (item.dropPosition) {
        setPosition(item.dropPosition);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const opacity = isDragging ? 0.4 : 1;
  return (
    <div
      ref={drag}
      className="rectangle"
      style={{
        backgroundColor: "#999",
        left: rectangle.x,
        top: rectangle.y,
        width: rectangle.width,
        height: rectangle.height,
        position: "absolute",
        opacity,
        cursor: "move",
      }}
    />
  );
}

// Convert viewport-relative positions to canvas-relative positions
function viewportToCanvasPosition(canvasRef, viewportPosition) {
  const canvasRect = canvasRef.getBoundingClientRect();
  let x = viewportPosition.x;
  x = x - canvasRect.left; // Convert mouse position which is relative to viewport, to a position relative to canvas
  let y = viewportPosition.y;
  y = y - canvasRect.top; // Convert mouse position which is relative to viewport, to a position relative to canvas
  return { x, y };
}