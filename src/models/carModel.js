class Car {
    constructor(plate, model, color) {
        this.plate = plate;
        this.model = model;
        this.color = color;
    }

    toString(){
        return "Plate: " + this.plate + "\nModel:" +this.model + "\nColor:" + this.color;   
    }
}

module.exports = Car;
