export default function EditRoom({ editRoomRef, sideBar }) {
    return (
        <div ref={editRoomRef} className={`absolute top-[70px] ${(sideBar > 50) ? "block left-[250px]" : "hidden"}  w-[200px] z-[3] py-5 bg-white`}>

        </div>
    );
}
