.PHONY: build run clean install

BINARY=cpm
MODULE=github.com/copilot-plugin-marketplace/cpm

build:
	go build -o $(BINARY) ./cmd/cpm/

run: build
	./$(BINARY)

clean:
	rm -f $(BINARY)

install: build
	cp $(BINARY) $(GOPATH)/bin/ 2>/dev/null || cp $(BINARY) ~/go/bin/

fmt:
	go fmt ./...

vet:
	go vet ./...

tidy:
	go mod tidy
