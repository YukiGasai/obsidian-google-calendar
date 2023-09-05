<script lang="ts">
    import { MoveType } from '../../helper/types';
    import type { MouseControlData } from '../../helper/types';

    export let timelineWidth: number;
    export let top:number;
    export let left:number;
    export let height:number;
    export let width:number;
    export let onDrag: (data: MouseControlData) => void;
    export let onDragClick: (data: MouseControlData) => void;
    export let onDragLongClick: (data: MouseControlData) => void;
    let DRAG_DELAY = 200;
    let drag: MouseControlData = null;
    let horizontal = 0;
    let handleMoveStart = (e: MouseEvent, moveType: MoveType) => {
        (e.target as HTMLDivElement).parentElement.style.zIndex = "1000";
        (e.target as HTMLDivElement).parentElement.parentElement.parentElement.style.overflow = "visible"
        let rect = (e.target as HTMLDivElement).getBoundingClientRect();
        let x = e.clientX - rect.left;
        horizontal = timelineWidth * ( left / 100 ) + x
        drag = {
            moveType,
            time: new Date().getTime(),
            e,
            startState: {
                top: top,
                left: left,
                height: height,
                width: width,
            },
            endState: {
                top: -1,
                left: -1,
                height: -1,
                width: -1,
                horizontal: 0
            },
        }
        width = 100;
        left = 0;

    };

    let handleMouseMove = (e: MouseEvent) => {
        if (!drag?.time) return;
        if (drag.time + DRAG_DELAY >= new Date().getTime()) return;
        if (!(drag.e?.target instanceof HTMLDivElement)) return;
        if (!(drag.e?.target.parentElement?.parentElement instanceof HTMLDivElement)) return;

        let newTop = top;
        let newHeight = height;

        if (drag.moveType === MoveType.DRAG) {
            newTop += e.movementY;
        } else if (drag.moveType === MoveType.RESIZE_BOTTOM) {
            newHeight += e.movementY
        } else if (drag.moveType === MoveType.RESIZE_TOP) {
            newTop += e.movementY;
            newHeight -= e.movementY;
        }

        if (
            newHeight > 10 &&
            newTop >= 0 &&
            newTop + newHeight <= drag.e.target.parentElement.parentElement.clientHeight
        ) {
            top = newTop;
            height = newHeight;
            drag.endState.top = top;
            drag.endState.height = height;
        }

        horizontal += e.movementX;
        const leftAmount = Math.floor(horizontal / (timelineWidth + 16))
        drag.endState.horizontal = leftAmount;
        left = leftAmount * 100;
    }

    let handleMouseUp = (e: MouseEvent) => {
        if (!drag?.time) return;
        if (drag.time + DRAG_DELAY < new Date().getTime()) {
            if (top === drag.startState.top && height === drag.startState.height) {
                drag.endState.width = drag.startState.width;
                drag.endState.left = drag.startState.left;
                width = drag.endState.width;
                left = drag.endState.left;
                (e.target as HTMLDivElement).parentElement.parentElement.parentElement.style.overflow = "hidden"
                onDragLongClick(drag);
            }else {
                
                onDrag(drag);
            }
        } else {
            (e.target as HTMLDivElement).parentElement.parentElement.parentElement.style.overflow = "hidden"
            onDragClick(drag);
        }
        (drag.e.target as HTMLDivElement).parentElement.style.zIndex = "0";
        drag.time = null;
        horizontal = 0;
    }

</script>

<div 
    class="dragHandle"
    on:mousedown={(e) => handleMoveStart(e, MoveType.DRAG)}
/>
<div 
    class="topHandle"
    on:mousedown={(e) => handleMoveStart(e, MoveType.RESIZE_TOP)}
/>
<div 
    class="bottomHandle"
    on:mousedown={(e) => handleMoveStart(e, MoveType.RESIZE_BOTTOM)}
/>
<svelte:window on:mouseup="{handleMouseUp}" on:mousemove="{handleMouseMove}"/>

<style>
    .dragHandle {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
    }

    .bottomHandle,
    .topHandle {
        position: absolute;
        height: 10px;
        width: 100%;
        left: 0;
        cursor: row-resize;
        z-index: 0;
    }

    .bottomHandle:hover,
    .topHandle:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    .bottomHandle {
        bottom: 0;
    }

    .topHandle {
        top: 0;
    }

</style>